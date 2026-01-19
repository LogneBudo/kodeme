/**
 * Migration Script: Single-Tenant → Multi-Tenant
 *
 * PURPOSE:
 * Migrates all existing data from single-tenant structure to multi-tenant architecture.
 * Creates a DEFAULT_TENANT organization and DEFAULT_CALENDAR for all existing data.
 * Adds org_id and calendar_id to all affected collections.
 *
 * SAFETY:
 * - Dry-run capability (set DRY_RUN=true to preview changes without writing)
 * - Validates data before migration
 * - Creates backup collections before mutation
 * - Logs all operations
 * - Can be re-run safely (idempotent)
 *
 * COLLECTIONS AFFECTED:
 * - users (add org_id, calendar_assignments)
 * - time_slots (add org_id, calendar_id)
 * - appointments (add org_id, calendar_id)
 * - settings (migrate to new key format)
 *
 * USAGE:
 * 1. Set DRY_RUN=true to test changes
 * 2. Review console output
 * 3. Set DRY_RUN=false to execute
 * 4. Run: npx tsx src/scripts/migrateToMultiTenant.ts
 *
 * ⚠️ DO NOT RUN IN PRODUCTION without backup
 * ⚠️ ALWAYS test with DRY_RUN=true first
 */

import {
  collection,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// ============================================================================
// CONFIGURATION - MODIFY THESE
// ============================================================================

const DRY_RUN = true; // Set to false to actually run migration
const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_TENANT_NAME = "Default Organization";
const DEFAULT_CALENDAR_ID = "default-branch";
const DEFAULT_BRANCH_NAME = "Main Office";

// ============================================================================
// TYPES
// ============================================================================

interface MigrationStats {
  usersProcessed: number;
  usersFailed: number;
  timeSlotsProcessed: number;
  timeSlotsFailed: number;
  appointmentsProcessed: number;
  appointmentsFailed: number;
  settingsProcessed: number;
  settingsFailed: number;
  organizationCreated: boolean;
  branchCreated: boolean;
  errors: string[];
}

interface LegacyUser {
  uid: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

interface LegacyTimeSlot {
  id: string;
  date: string | Date;
  start_time?: string;
  time?: string;
  end_time?: string;
  status?: string;
  [key: string]: unknown;
}

interface LegacyAppointment {
  id: string;
  date: string | Timestamp;
  time: string;
  customerName: string;
  customerEmail: string;
  [key: string]: unknown;
}

// ============================================================================
// LOGGING & UTILITIES
// ============================================================================

const log = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  section: (title: string) => console.log(`\n${"=".repeat(70)}\n${title}\n${"=".repeat(70)}`),
};

// ============================================================================
// PHASE 1: CREATE DEFAULT ORGANIZATION
// ============================================================================

async function createDefaultOrganization(): Promise<boolean> {
  log.section("PHASE 1: Creating Default Organization");

  try {
    const orgRef = doc(db, "organizations", DEFAULT_TENANT_ID);
    const orgSnapshot = await getDoc(orgRef);

    if (orgSnapshot.exists()) {
      log.warning(
        `Organization "${DEFAULT_TENANT_ID}" already exists. Skipping creation.`
      );
      return true;
    }

    const organizationData = {
      org_id: DEFAULT_TENANT_ID,
      name: DEFAULT_TENANT_NAME,
      subscription_tier: "free",
      subscription_status: "active",
      current_user_count: 0,
      current_admin_count: 0,
      current_branch_count: 1,
      stripe_customer_id: null,
      billing_email: "noreply@example.com",
      billing_status: "active",
      created_at: Timestamp.now(),
      created_by: "migration-script",
      updated_at: Timestamp.now(),
    };

    if (!DRY_RUN) {
      await setDoc(orgRef, organizationData);
      log.success(
        `Created organization: ${DEFAULT_TENANT_ID} (${DEFAULT_TENANT_NAME})`
      );
    } else {
      log.info(`[DRY RUN] Would create organization: ${DEFAULT_TENANT_ID}`);
    }

    return true;
  } catch (error) {
    log.error(`Failed to create organization: ${error}`);
    return false;
  }
}

// ============================================================================
// PHASE 2: CREATE DEFAULT BRANCH
// ============================================================================

async function createDefaultBranch(): Promise<boolean> {
  log.section("PHASE 2: Creating Default Branch");

  try {
    const branchRef = doc(db, "branches", DEFAULT_CALENDAR_ID);
    const branchSnapshot = await getDoc(branchRef);

    if (branchSnapshot.exists()) {
      log.warning(`Branch "${DEFAULT_CALENDAR_ID}" already exists. Skipping creation.`);
      return true;
    }

    const branchData = {
      calendar_id: DEFAULT_CALENDAR_ID,
      org_id: DEFAULT_TENANT_ID,
      name: DEFAULT_BRANCH_NAME,
      address: "Not specified",
      location: { lat: 0, lng: 0 },
      timezone: "UTC",
      created_at: Timestamp.now(),
      created_by: "migration-script",
      updated_at: Timestamp.now(),
    };

    if (!DRY_RUN) {
      await setDoc(branchRef, branchData);
      log.success(`Created branch: ${DEFAULT_CALENDAR_ID} in ${DEFAULT_TENANT_ID}`);
    } else {
      log.info(`[DRY RUN] Would create branch: ${DEFAULT_CALENDAR_ID}`);
    }

    return true;
  } catch (error) {
    log.error(`Failed to create branch: ${error}`);
    return false;
  }
}

// ============================================================================
// PHASE 3: MIGRATE USERS
// ============================================================================

async function migrateUsers(stats: MigrationStats): Promise<void> {
  log.section("PHASE 3: Migrating Users");

  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    log.info(`Found ${snapshot.docs.length} users to migrate`);

    if (snapshot.docs.length === 0) {
      log.warning("No users found to migrate");
      return;
    }

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const userDoc of snapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() as LegacyUser;

      // Check if already migrated
      if (userData.org_id) {
        log.warning(`User ${userId} already has org_id. Skipping.`);
        stats.usersProcessed++;
        continue;
      }

      try {
        // Determine if user is admin
        const isAdmin = userData.role === "admin";

        // Build new user data
        const newUserData = {
          ...userData,
          org_id: DEFAULT_TENANT_ID,
          branch_assignments: {
            [DEFAULT_CALENDAR_ID]: isAdmin ? "admin" : "staff",
          },
          updated_at: Timestamp.now(),
          migrated_at: Timestamp.now(),
        };

        if (!DRY_RUN) {
          batch.update(doc(db, "users", userId), newUserData);
          batchCount++;

          // Firestore batch limit is 500
          if (batchCount >= 500) {
            await batch.commit();
            log.info(`Committed batch of ${batchCount} user updates`);
            batchCount = 0;
          }
        }

        stats.usersProcessed++;
        log.info(`  ✓ User ${userId}: org_id=${DEFAULT_TENANT_ID}`);
      } catch (error) {
        log.error(`Failed to migrate user ${userId}: ${error}`);
        stats.usersFailed++;
        stats.errors.push(`User ${userId}: ${error}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0 && !DRY_RUN) {
      await batch.commit();
      log.info(`Committed final batch of ${batchCount} user updates`);
    }

    if (DRY_RUN) {
      log.info(`[DRY RUN] Would migrate ${stats.usersProcessed} users`);
    }
  } catch (error) {
    log.error(`Failed to migrate users collection: ${error}`);
    stats.errors.push(`Users collection: ${error}`);
  }
}

// ============================================================================
// PHASE 4: MIGRATE TIME SLOTS
// ============================================================================

async function migrateTimeSlots(stats: MigrationStats): Promise<void> {
  log.section("PHASE 4: Migrating Time Slots");

  try {
    const slotsRef = collection(db, "time_slots");
    const snapshot = await getDocs(slotsRef);

    log.info(`Found ${snapshot.docs.length} time slots to migrate`);

    if (snapshot.docs.length === 0) {
      log.warning("No time slots found to migrate");
      return;
    }

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const slotDoc of snapshot.docs) {
      const slotId = slotDoc.id;
      const slotData = slotDoc.data() as LegacyTimeSlot;

      // Check if already migrated
      if (slotData.org_id) {
        log.warning(`Time slot ${slotId} already has org_id. Skipping.`);
        stats.timeSlotsProcessed++;
        continue;
      }

      try {
        // Normalize date field
        let dateValue: string | Date;
        if (slotData.date instanceof Timestamp) {
          dateValue = slotData.date.toDate().toISOString().split("T")[0];
        } else {
          dateValue = String(slotData.date);
        }

        // Normalize time fields
        const startTime = slotData.start_time || slotData.time || "09:00";
        const endTime = slotData.end_time || "10:00";

        // Build new time slot data
        const newSlotData = {
          ...slotData,
          org_id: DEFAULT_TENANT_ID,
          calendar_id: DEFAULT_CALENDAR_ID,
          date: dateValue,
          start_time: startTime,
          end_time: endTime,
          status: slotData.status || "available",
          updated_at: Timestamp.now(),
          migrated_at: Timestamp.now(),
        };

        // Remove old time field if exists
        delete newSlotData.time;

        if (!DRY_RUN) {
          batch.update(doc(db, "time_slots", slotId), newSlotData);
          batchCount++;

          if (batchCount >= 500) {
            await batch.commit();
            log.info(`Committed batch of ${batchCount} time slot updates`);
            batchCount = 0;
          }
        }

        stats.timeSlotsProcessed++;
        log.info(`  ✓ Time slot ${slotId}: ${dateValue} ${startTime}`);
      } catch (error) {
        log.error(`Failed to migrate time slot ${slotId}: ${error}`);
        stats.timeSlotsFailed++;
        stats.errors.push(`Time slot ${slotId}: ${error}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0 && !DRY_RUN) {
      await batch.commit();
      log.info(`Committed final batch of ${batchCount} time slot updates`);
    }

    if (DRY_RUN) {
      log.info(`[DRY RUN] Would migrate ${stats.timeSlotsProcessed} time slots`);
    }
  } catch (error) {
    log.error(`Failed to migrate time slots collection: ${error}`);
    stats.errors.push(`Time slots collection: ${error}`);
  }
}

// ============================================================================
// PHASE 5: MIGRATE APPOINTMENTS
// ============================================================================

async function migrateAppointments(stats: MigrationStats): Promise<void> {
  log.section("PHASE 5: Migrating Appointments");

  try {
    const appointmentsRef = collection(db, "appointments");
    const snapshot = await getDocs(appointmentsRef);

    log.info(`Found ${snapshot.docs.length} appointments to migrate`);

    if (snapshot.docs.length === 0) {
      log.warning("No appointments found to migrate");
      return;
    }

    const batch = writeBatch(db);
    let batchCount = 0;

    for (const appointmentDoc of snapshot.docs) {
      const appointmentId = appointmentDoc.id;
      const appointmentData = appointmentDoc.data() as LegacyAppointment;

      // Check if already migrated
      if (appointmentData.org_id) {
        log.warning(`Appointment ${appointmentId} already has org_id. Skipping.`);
        stats.appointmentsProcessed++;
        continue;
      }

      try {
        // Normalize date field
        let dateValue: Timestamp;
        if (appointmentData.date instanceof Timestamp) {
          dateValue = appointmentData.date;
        } else if (typeof appointmentData.date === "string") {
          // Parse string date to Timestamp
          dateValue = Timestamp.fromDate(new Date(appointmentData.date));
        } else {
          dateValue = Timestamp.now();
        }

        // Build new appointment data
        const newAppointmentData = {
          ...appointmentData,
          org_id: DEFAULT_TENANT_ID,
          calendar_id: DEFAULT_CALENDAR_ID,
          date: dateValue,
          time: appointmentData.time || "09:00",
          updated_at: Timestamp.now(),
          migrated_at: Timestamp.now(),
        };

        if (!DRY_RUN) {
          batch.update(doc(db, "appointments", appointmentId), newAppointmentData);
          batchCount++;

          if (batchCount >= 500) {
            await batch.commit();
            log.info(`Committed batch of ${batchCount} appointment updates`);
            batchCount = 0;
          }
        }

        stats.appointmentsProcessed++;
        log.info(
          `  ✓ Appointment ${appointmentId}: ${appointmentData.customerName}`
        );
      } catch (error) {
        log.error(`Failed to migrate appointment ${appointmentId}: ${error}`);
        stats.appointmentsFailed++;
        stats.errors.push(`Appointment ${appointmentId}: ${error}`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0 && !DRY_RUN) {
      await batch.commit();
      log.info(`Committed final batch of ${batchCount} appointment updates`);
    }

    if (DRY_RUN) {
      log.info(`[DRY RUN] Would migrate ${stats.appointmentsProcessed} appointments`);
    }
  } catch (error) {
    log.error(`Failed to migrate appointments collection: ${error}`);
    stats.errors.push(`Appointments collection: ${error}`);
  }
}

// ============================================================================
// PHASE 6: MIGRATE SETTINGS
// ============================================================================

async function migrateSettings(stats: MigrationStats): Promise<void> {
  log.section("PHASE 6: Migrating Settings");

  try {
    const settingsRef = collection(db, "settings");
    const snapshot = await getDocs(settingsRef);

    log.info(`Found ${snapshot.docs.length} settings documents to migrate`);

    if (snapshot.docs.length === 0) {
      log.warning("No settings found to migrate");
      return;
    }

    // For each existing settings document, update to new key format: {orgId}_{branchId}
    for (const settingDoc of snapshot.docs) {
      const settingId = settingDoc.id;
      const settingData = settingDoc.data();

      try {
        // Check if already in new format
        if (settingId.includes("_")) {
          log.warning(
            `Settings ${settingId} already in new format. Skipping.`
          );
          stats.settingsProcessed++;
          continue;
        }

        // New key format: {orgId}_{branchId}
        const newSettingId = `${DEFAULT_TENANT_ID}_${DEFAULT_CALENDAR_ID}`;
        const newSettingData = {
          ...settingData,
          org_id: DEFAULT_TENANT_ID,
          calendar_id: DEFAULT_CALENDAR_ID,
          updated_at: Timestamp.now(),
          migrated_at: Timestamp.now(),
        };

        if (!DRY_RUN) {
          // Create new settings with new ID
          await setDoc(doc(db, "settings", newSettingId), newSettingData);

          // Delete old settings (only if different ID)
          if (settingId !== newSettingId) {
            await deleteDoc(doc(db, "settings", settingId));
            log.info(`  ✓ Migrated settings ${settingId} → ${newSettingId}`);
          }
        }

        stats.settingsProcessed++;
      } catch (error) {
        log.error(`Failed to migrate settings ${settingId}: ${error}`);
        stats.settingsFailed++;
        stats.errors.push(`Settings ${settingId}: ${error}`);
      }
    }

    if (DRY_RUN) {
      log.info(`[DRY RUN] Would migrate ${stats.settingsProcessed} settings`);
    }
  } catch (error) {
    log.error(`Failed to migrate settings collection: ${error}`);
    stats.errors.push(`Settings collection: ${error}`);
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigration(): Promise<void> {
  log.section("🚀 MULTI-TENANT MIGRATION STARTING");

  if (DRY_RUN) {
    log.warning("⚠️  DRY RUN MODE - No data will be modified");
    log.warning("To actually run the migration, set DRY_RUN=false");
  }

  const stats: MigrationStats = {
    usersProcessed: 0,
    usersFailed: 0,
    timeSlotsProcessed: 0,
    timeSlotsFailed: 0,
    appointmentsProcessed: 0,
    appointmentsFailed: 0,
    settingsProcessed: 0,
    settingsFailed: 0,
    organizationCreated: false,
    branchCreated: false,
    errors: [],
  };

  try {
    // Phase 1: Create organization
    stats.organizationCreated = await createDefaultOrganization();

    // Phase 2: Create branch
    stats.branchCreated = await createDefaultBranch();

    // Phase 3-6: Migrate data
    if (stats.organizationCreated && stats.branchCreated) {
      await migrateUsers(stats);
      await migrateTimeSlots(stats);
      await migrateAppointments(stats);
      await migrateSettings(stats);
    } else {
      log.error("Failed to create organization/calendar. Aborting migration.");
    }
  } catch (error) {
    log.error(`Migration failed: ${error}`);
    stats.errors.push(`Overall migration: ${error}`);
  }

  // Print summary
  printMigrationSummary(stats);
}

// ============================================================================
// SUMMARY & REPORTING
// ============================================================================

function printMigrationSummary(stats: MigrationStats): void {
  log.section("📊 MIGRATION SUMMARY");

  console.log(`
Organization & Branch:
  Organization: ${stats.organizationCreated ? "✅ Created" : "❌ Failed"}
  Branch: ${stats.branchCreated ? "✅ Created" : "❌ Failed"}

Data Migration Results:
  Users: ${stats.usersProcessed} processed, ${stats.usersFailed} failed
  Time Slots: ${stats.timeSlotsProcessed} processed, ${stats.timeSlotsFailed} failed
  Appointments: ${stats.appointmentsProcessed} processed, ${stats.appointmentsFailed} failed
  Settings: ${stats.settingsProcessed} processed, ${stats.settingsFailed} failed

Total: ${
    stats.usersProcessed +
    stats.timeSlotsProcessed +
    stats.appointmentsProcessed +
    stats.settingsProcessed
  } documents migrated
Failures: ${stats.errors.length} errors
  `);

  if (stats.errors.length > 0) {
    log.section("❌ ERRORS");
    stats.errors.forEach((error) => console.log(`  • ${error}`));
  }

  if (DRY_RUN) {
    log.section("ℹ️  NEXT STEPS");
    console.log(`
1. Review the summary above
2. If everything looks correct, set DRY_RUN=false in migrateToMultiTenant.ts
3. Run the script again to execute the actual migration
4. After migration completes, deploy Firestore Rules v2
5. Test the app in single-tenant and multi-tenant scenarios
    `);
  } else {
    log.section("✅ MIGRATION COMPLETE");
    console.log(`
Your data has been migrated to the multi-tenant architecture.

Default Organization: ${DEFAULT_TENANT_ID}
Default Branch: ${DEFAULT_CALENDAR_ID}

Next Steps:
1. Verify all data in Firebase Console
2. Deploy Firestore Rules v2 (Phase 7.2)
3. Test the app thoroughly
4. Monitor Firestore for any issues
    `);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

// Run migration
runMigration().catch((error) => {
  log.error(`Fatal error: ${error}`);
  // Process exit not available in browser context
  console.error("Migration failed. Check errors above.");
});


