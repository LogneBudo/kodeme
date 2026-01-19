
import { useState, useEffect, useCallback } from "react";
import WorkingHoursSettings from "../components/admin/settings/WorkingHoursSettings";
import WorkingDaysSettings from "../components/admin/settings/WorkingDaysSettings";
import BlockedSlotsSettings from "../components/admin/settings/BlockedSlotsSettings";
import CalendarIntegrationSettings from "../components/admin/settings/CalendarIntegrationSettings";
import RestaurantSettings from "../components/admin/settings/RestaurantSettings";
import AdminPageHeader from "../components/admin/AdminPageHeader";
import { useSearchParams } from "react-router-dom";
import { getTenantSettings, updateTenantSettings, type Settings, type BlockedSlot } from "../api/firebaseApi";
import { useAuth } from "../context/AuthContext";
import { Settings as SettingsIcon, Clock, Calendar, Ban, Save, CalendarSync } from "lucide-react";
import { toast } from "sonner";
import styles from "./AdminBase.module.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper to fetch calendar connection status
async function fetchCalendarStatus(backendUrl: string) {
	try {
		const resp = await fetch(`${backendUrl}/api/calendar/status`, { credentials: "include" });
		if (!resp.ok) return { connected: false, outlookConnected: false };
		return await resp.json();
	} catch {
		return { connected: false, outlookConnected: false };
	}
}

// Settings groups definition
const SETTINGS_GROUPS = [
	{
		id: "hours",
		label: "Working Hours",
		icon: Clock,
		description: "Set your daily business hours",
	},
	{
		id: "days",
		label: "Working Days",
		icon: Calendar,
		description: "Define your operating days",
	},
	{
		id: "blocked",
		label: "Blocked Time Slots",
		icon: Ban,
		description: "Manage breaks and unavailable times",
	},
	{
		id: "calendar",
		label: "Calendar Integration",
		icon: CalendarSync,
		description: "Connect and sync with your calendar",
	},
	{
		id: "restaurants",
		label: "Restaurants",
		icon: Calendar, // Reuse icon, or replace with a restaurant icon if available
		description: "Set city, perimeter, and manage restaurant list",
	},
];

export default function SettingsPage() {
	const { orgId, calendarId } = useAuth();
	const [searchParams] = useSearchParams();
	const [settings, setSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savedRecently, setSavedRecently] = useState(false);
	const [activeTab, setActiveTab] = useState("hours");
	const [googleConnecting, setGoogleConnecting] = useState(false);
	const [outlookConnecting, setOutlookConnecting] = useState(false);
	const [calendarConnected, setCalendarConnected] = useState(false);
	const [outlookConnected, setOutlookConnected] = useState(false);
	const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";
		// Fetch real connection status from backend
		const pollCalendarStatus = useCallback(async () => {
			const status = await fetchCalendarStatus(backendUrl);
			setCalendarConnected(!!status.connected);
			setOutlookConnected(!!status.outlookConnected);
		}, [backendUrl]);
	const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedSlot>({
		_key: Date.now().toString(),
		startTime: "12:00",
		endTime: "13:00",
		label: "Lunch",
	});

	// City validation state
	type CityValidationOption = { display_name: string; lat: string; lon: string; country?: string };
	const [cityValidation, setCityValidation] = useState<{
		valid: boolean;
		city?: string;
		country?: string;
		error?: string;
		options?: CityValidationOption[];
		selectedIdx?: number;
	} | null>(null);
	const [validatingCity, setValidatingCity] = useState(false);

	async function handleValidateCity() {
		setValidatingCity(true);
		setCityValidation(null);
		const city = settings?.restaurantCity || "";
		if (!city.trim()) {
			setCityValidation({ valid: false, error: "Enter a city name" });
			setValidatingCity(false);
			return;
		}
		try {
			// Use OpenStreetMap Nominatim API for free geocoding
			const resp = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=10`);
			const data = await resp.json() as { display_name: string; lat: string; lon: string }[];
			if (data && data.length > 0) {
				if (data.length === 1) {
					const firstResult = data[0];
					const cityName = firstResult.display_name.split(",")[0].trim();
					const countryName = firstResult.display_name.split(",").pop()?.trim() || "";
					// Create options with just city name (country will be added separately in the display)
					const cleanedOptions = data.map((d: { display_name: string; lat: string; lon: string }) => ({
						display_name: d.display_name.split(",")[0].trim(),
						lat: d.lat,
						lon: d.lon,
						country: d.display_name.split(",").pop()?.trim() || ""
					}));
					setCityValidation({ 
						valid: true, 
						city: cityName, 
						country: countryName, 
						options: cleanedOptions, 
						selectedIdx: 0 
					});
				} else {
					// Create options with just city name (country will be added separately in the display)
					const cleanedOptions = data.map((d: { display_name: string; lat: string; lon: string }) => ({
						display_name: d.display_name.split(",")[0].trim(),
						lat: d.lat,
						lon: d.lon,
						country: d.display_name.split(",").pop()?.trim() || ""
					}));
					setCityValidation({ valid: false, options: cleanedOptions, selectedIdx: undefined });
				}
			} else {
				setCityValidation({ valid: false, error: "City not found" });
			}
		} catch {
			setCityValidation({ valid: false, error: "Validation failed" });
		}
		setValidatingCity(false);
	}

	function handleSelectCityOption(idx: number) {
		if (!cityValidation?.options) return;
		const selected = cityValidation.options[idx];
		const cityName = selected.display_name;
		// Get country from the country field that's already parsed in options
		const countryName = selected.country || "";
		
		setCityValidation({
			valid: true,
			city: cityName,
			country: countryName,
			options: cityValidation.options,
			selectedIdx: idx
		});
		// Also save to settings
		if (settings) {
			setSettings({
				...settings,
				restaurantCity: cityName,
				restaurantCountry: countryName
			});
		}
	}

	useEffect(() => {
		loadSettings();
		pollCalendarStatus();
		// Check if returning from OAuth callback
		const calendarParam = searchParams.get("calendar");
		const providerParam = searchParams.get("provider");
		if (calendarParam === "connected" || calendarParam === "callback_received") {
			toast.success(`${providerParam === "outlook" ? "Outlook" : "Google"} Calendar connected!`);
			setActiveTab("calendar");
			setGoogleConnecting(false);
			setOutlookConnecting(false);
			pollCalendarStatus();
		} else if (searchParams.get("error")) {
			const errorMsg = searchParams.get("error");
			toast.error(`Failed to connect ${providerParam === "outlook" ? "Outlook" : "Google"} Calendar: ${errorMsg}`);
			setGoogleConnecting(false);
			setOutlookConnecting(false);
		}
		// eslint-disable-next-line
	}, [searchParams, orgId, calendarId, pollCalendarStatus]);
	// Disconnect handlers
	async function handleDisconnectGoogle() {
		try {
			const resp = await fetch(`${backendUrl}/api/calendar/disconnect?provider=google`, { method: "POST", credentials: "include" });
			if (resp.ok) {
				toast.success("Google Calendar disconnected.");
				setCalendarConnected(false);
				pollCalendarStatus();
			} else {
				toast.error("Failed to disconnect Google Calendar");
			}
		} catch {
			toast.error("Failed to disconnect Google Calendar");
		}
	}

	async function handleDisconnectOutlook() {
		try {
			const resp = await fetch(`${backendUrl}/api/calendar/disconnect?provider=outlook`, { method: "POST", credentials: "include" });
			if (resp.ok) {
				toast.success("Outlook Calendar disconnected.");
				setOutlookConnected(false);
				pollCalendarStatus();
			} else {
				toast.error("Failed to disconnect Outlook Calendar");
			}
		} catch {
			toast.error("Failed to disconnect Outlook Calendar");
		}
	}

	async function loadSettings() {
		if (!orgId || !calendarId) return;
		setLoading(true);
		const data = await getTenantSettings(orgId, calendarId);

		setSettings(data);
		// If a city is already saved, populate the cityValidation state
		if (data.restaurantCity) {
			console.log("Setting city validation with:", {
				city: data.restaurantCity,
				country: data.restaurantCountry
			});
			setCityValidation({
				valid: true,
				city: data.restaurantCity,
				country: data.restaurantCountry || "",
				// Add the saved city as an option so the badge displays correctly
				options: [{
					display_name: data.restaurantCity,
					lat: "0",
					lon: "0",
					country: data.restaurantCountry || ""
				}],
				selectedIdx: 0
			});
		}
		setLoading(false);
	}

	async function handleSave() {
		if (!orgId || !calendarId || !settings) return;
		setSaving(true);
		setSavedRecently(false);

		const success = await updateTenantSettings(orgId, calendarId, settings);
		setSaving(false);
		if (success) {
			toast.success("Settings saved successfully!");
			setSavedRecently(true);
			setTimeout(() => setSavedRecently(false), 2000);
		} else {
			toast.error("Failed to save settings");
		}
	}

	function handleAddBlockedSlot() {
		if (!settings) return;
		// Validate times
		if (newBlockedSlot.startTime >= newBlockedSlot.endTime) {
			toast.error("Start time must be before end time");
			return;
		}
		const updated = {
			...settings,
			blockedSlots: [
				...settings.blockedSlots,
				{
					...newBlockedSlot,
					_key: Date.now().toString(),
				},
			],
		};
		setSettings(updated);
		setNewBlockedSlot({ _key: Date.now().toString(), startTime: "12:00", endTime: "13:00", label: "Lunch" });
	}

	function handleRemoveBlockedSlot(key: string) {
		if (!settings) return;
		const updated = {
			...settings,
			blockedSlots: settings.blockedSlots.filter((s) => s._key !== key),
		};
		setSettings(updated);
	}

	async function handleConnectGoogle() {
		try {
			setGoogleConnecting(true);
			const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";
			const response = await fetch(`${backendUrl}/api/auth/google/init`);
			const data = await response.json();
			if (data.url) {
				// Redirect to Google OAuth
				window.location.href = data.url;
			} else {
				toast.error("Failed to start Google OAuth");
			}
		} catch (error) {
			console.error("Error connecting Google:", error);
			toast.error("Failed to connect Google Calendar");
		} finally {
			setGoogleConnecting(false);
		}
	}

	async function handleConnectOutlook() {
		try {
			setOutlookConnecting(true);
			const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";
			const response = await fetch(`${backendUrl}/api/auth/outlook/init`);
			const data = await response.json();
			if (data.url) {
				// Redirect to Microsoft OAuth
				window.location.href = data.url;
			} else {
				toast.error("Failed to start Outlook OAuth");
			}
		} catch (error) {
			console.error("Error connecting Outlook:", error);
			toast.error("Failed to connect Outlook Calendar");
		} finally {
			setOutlookConnecting(false);
		}
	}

	if (loading) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>
					Loading settings...
				</div>
			</div>
		);
	}

	if (!settings) {
		return (
			<div className={styles.page}>
				<div className={styles.loading}>
					Error loading settings
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.content}>
				{/* Header */}
				<AdminPageHeader 
					icon={SettingsIcon}
					title="Settings"
					subtitle="Manage your booking preferences and availability"
				/>

			{/* Main Content */}
			<div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "32px" }}>
					{/* Sidebar Navigation */}
					<div>
						<div style={{
							background: "white",
							borderRadius: "12px",
							overflow: "hidden",
							boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
							padding: "0",
						}}>
							{SETTINGS_GROUPS.map((group) => {
								const Icon = group.icon;
								const isActive = activeTab === group.id;
								return (
									<button
										key={group.id}
										onClick={() => setActiveTab(group.id)}
										style={{
											width: "100%",
											padding: "20px 24px",
											background: isActive ? "#222" : "white",
											border: "none",
											borderBottom: "1px solid #e5e5e5",
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											gap: "16px",
											transition: "background 0.2s",
											fontWeight: isActive ? 700 : 500,
											color: isActive ? "white" : "#222",
											boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
										}}
										onMouseEnter={(e) => {
											if (!isActive) {
												(e.currentTarget as HTMLElement).style.background = "#f5f5f5";
											}
										}}
										onMouseLeave={(e) => {
											if (!isActive) {
												(e.currentTarget as HTMLElement).style.background = "white";
											}
										}}
									>
										<Icon
											size={22}
											style={{
												color: isActive ? "white" : "#666",
												marginTop: "2px",
												flexShrink: 0,
											}}
										/>
										<div style={{ textAlign: "left" }}>
											<div
												style={{
													fontSize: "15px",
													fontWeight: 600,
													color: isActive ? "white" : "#222",
													marginBottom: "2px",
												}}
											>
												{group.label}
											</div>
											<div
												style={{
													fontSize: "13px",
													color: isActive ? "rgba(255,255,255,0.7)" : "#999",
												}}
											>
												{group.description}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					</div>

					{/* Content Area */}
					<div>
						<div style={{
							background: "white",
							borderRadius: "12px",
							padding: "36px 40px 32px 40px",
							boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
							minHeight: "520px",
						}}>
							{/* Working Hours Tab */}
							{activeTab === "hours" && (
								<WorkingHoursSettings
									workingHours={settings.workingHours}
									setWorkingHours={hours => setSettings({ ...settings, workingHours: hours })}
								/>
							)}
							{/* Working Days Tab */}
							{activeTab === "days" && (
								<WorkingDaysSettings
									workingDays={settings.workingDays}
									setWorkingDays={days => setSettings({ ...settings, workingDays: days })}
									DAYS={DAYS}
								/>
							)}
							{/* Blocked Slots Tab */}
							{activeTab === "blocked" && (
								<BlockedSlotsSettings
									blockedSlots={settings.blockedSlots}
									newBlockedSlot={newBlockedSlot}
									setNewBlockedSlot={setNewBlockedSlot}
									handleAddBlockedSlot={handleAddBlockedSlot}
									handleRemoveBlockedSlot={handleRemoveBlockedSlot}
								/>
							)}
							{/* Calendar Integration Tab */}
							{activeTab === "calendar" && (
								<CalendarIntegrationSettings
									calendarSync={settings.calendarSync}
									setCalendarSync={sync => setSettings({ ...settings, calendarSync: sync })}
									calendarConnected={calendarConnected}
									outlookConnected={outlookConnected}
									googleConnecting={googleConnecting}
									outlookConnecting={outlookConnecting}
									handleConnectGoogle={handleConnectGoogle}
									handleConnectOutlook={handleConnectOutlook}
									handleDisconnectGoogle={handleDisconnectGoogle}
									handleDisconnectOutlook={handleDisconnectOutlook}
								/>
							)}
														{/* Restaurants Tab */}
														{activeTab === "restaurants" && (
															<RestaurantSettings
																city={settings.restaurantCity || ""}
																setCity={city => setSettings({ ...settings, restaurantCity: city })}
																perimeter={settings.restaurantPerimeterKm || 5}
																setPerimeter={perimeter => setSettings({ ...settings, restaurantPerimeterKm: perimeter })}
																restaurants={settings.restaurants || []}
																setRestaurants={restaurants => setSettings({ ...settings, restaurants })}
																curatedList={settings.curatedList || ""}
																setCuratedList={list => {
																	const parsed = list
																		.split(",")
																		.map(name => ({ name: name.trim(), address: "", website: "", lat: 0, lng: 0 }))
																		.filter(r => r.name);
																	setSettings({
																		...settings,
																		curatedList: list,
																		restaurants: parsed
																	});
																}}
																cityValidationLoading={validatingCity}
																cityValidationError={cityValidation?.error || null}
																cityOptions={cityValidation?.options?.map(opt => ({
																	displayName: opt.display_name,
																	lat: Number(opt.lat),
																	lon: Number(opt.lon),
																country: opt.country || "",
																})) || []}
																selectedCityIndex={cityValidation?.selectedIdx ?? null}
															setSelectedCityIndex={idx => idx !== null ? handleSelectCityOption(idx) : setCityValidation(null)}
																handleValidateCity={handleValidateCity}
																country={settings.restaurantCountry || ""}
															/>
														)}
														{/* Save Button */}
							<div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid #e5e5e5" }}>
								<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
									<button
										onClick={handleSave}
											disabled={saving}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "8px",
											padding: "12px 24px",
												background: saving ? "#999" : "#222",
											color: "white",
											border: "none",
											borderRadius: "6px",
											fontSize: "14px",
											fontWeight: 600,
												cursor: saving ? "not-allowed" : "pointer",
											transition: "background 0.2s",
										}}
										onMouseEnter={(e) => {
												if (!saving) {
													(e.currentTarget as HTMLElement).style.background = "#404040";
												}
										}}
										onMouseLeave={(e) => {
												if (!saving) {
													(e.currentTarget as HTMLElement).style.background = "#222";
												} else {
													(e.currentTarget as HTMLElement).style.background = "#999";
												}
										}}
									>
										<Save size={16} />
										{saving ? "Saving..." : "Save Settings"}
									</button>
									{savedRecently && (
										<span style={{ 
											color: "#22c55e", 
											fontWeight: 600, 
											fontSize: "14px",
											display: "flex",
											alignItems: "center",
											gap: "4px"
										}}>
											✓ Saved!
										</span>
									)}
								</div>
								<p style={{
									marginTop: "12px",
									fontSize: "13px",
									color: "#666",
								}}>
									Changes are saved across all sections
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
