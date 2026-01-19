# Manual Calendar Fix Instructions

Since the script can't bypass Firestore security rules, here's how to fix the data manually in the Firebase Console:

## Step 1: Create Root Calendar Document

1. Go to Firebase Console: https://console.firebase.google.com/project/easyappointment-6d2a1/firestore
2. Navigate to the `calendars` collection (root level)
3. Click **"Add document"**
4. Set **Document ID**: `rE88jIrf0ntQUqF05B5B-primary`
5. Add these fields:

```
created_at: timestamp (set to current time)
created_by: string = f0hdtOnHEqhTXS1FhgTWlo7yHGA3
id: string = rE88jIrf0ntQUqF05B5B-primary
name: string = Primary Calendar
org_id: string = rE88jIrf0ntQUqF05B5B
timezone: string = Europe/Bucharest
```

6. Click **"Save"**

## Step 2: Fix User Document

1. In Firestore, navigate to `users` collection
2. Click on document `f0hdtOnHEqhTXS1FhgTWlo7yHGA3`
3. Edit the `org_id` field: change from `ncvqm8JwbbCfBSYOFaLh` to `rE88jIrf0ntQUqF05B5B`
4. Verify `branch_assignments` has: `{ "rE88jIrf0ntQUqF05B5B-primary": "owner" }`
5. Click **"Save"**

## Step 3: Verify

1. Reload your app at `/admin/debug`
2. You should now see:
   - Organization: "Dr Dolittle" (rE88jIrf0ntQUqF05B5B)
   - Calendar: "Primary Calendar"
3. Navigate to any admin page to confirm calendars are loading

---

**Note**: These are the exact values from your Firebase console screenshot. The issue was that the calendar existed in the `organizations/{orgId}/calendars` subcollection but not in the root `calendars` collection where the app queries.
