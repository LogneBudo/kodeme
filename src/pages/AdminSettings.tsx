
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getSettings, updateSettings, type Settings, type BlockedSlot } from "../api/firebaseApi";
import { Settings as SettingsIcon, Plus, Trash2, Clock, Calendar, Ban, Save, CalendarSync } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

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
];

export default function SettingsPage() {
	const [searchParams] = useSearchParams();
	const [settings, setSettings] = useState<Settings | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("hours");
	const [googleConnecting, setGoogleConnecting] = useState(false);
	const [outlookConnecting, setOutlookConnecting] = useState(false);
	const [calendarConnected, setCalendarConnected] = useState(false);
	const [outlookConnected, setOutlookConnected] = useState(false);
	const [newBlockedSlot, setNewBlockedSlot] = useState<BlockedSlot>({
		_key: Date.now().toString(),
		startTime: "12:00",
		endTime: "13:00",
		label: "Lunch",
	});

	useEffect(() => {
		loadSettings();
		checkCalendarStatus();
		// Check if returning from OAuth callback
		const calendarParam = searchParams.get("calendar");
		const providerParam = searchParams.get("provider");
		if (calendarParam === "connected" || calendarParam === "callback_received") {
			if (providerParam === "outlook") {
				toast.success("Outlook Calendar connected!");
				setOutlookConnected(true);
				setOutlookConnecting(false);
			} else {
				toast.success("Google Calendar connected!");
				setCalendarConnected(true);
				setGoogleConnecting(false);
			}
			setActiveTab("calendar");
		} else if (searchParams.get("error")) {
			const errorMsg = searchParams.get("error");
			toast.error(`Failed to connect ${providerParam === "outlook" ? "Outlook" : "Google"} Calendar: ${errorMsg}`);
			setGoogleConnecting(false);
			setOutlookConnecting(false);
		}
	}, [searchParams]);

	async function loadSettings() {
		setLoading(true);
		const data = await getSettings();
		setSettings(data);
		setLoading(false);
	}

	async function checkCalendarStatus() {
		try {
			const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
			const response = await fetch(`${backendUrl}/api/calendar/status`);
			const data = await response.json();
			setCalendarConnected(data.connected);
			setOutlookConnected(data.outlookConnected || false);
		} catch (error) {
			console.error("Failed to check calendar status:", error);
			setCalendarConnected(false);
			setOutlookConnected(false);
		}
	}

	async function handleSave() {
		if (!settings) return;
		setSaving(true);
		const success = await updateSettings(settings);
		setSaving(false);
		if (success) {
			toast.success("Settings saved successfully!");
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
			const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
			const response = await fetch(`${backendUrl}/auth/google/init`);
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
			const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3001";
			const response = await fetch(`${backendUrl}/auth/outlook/init`);
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
			<div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
				Loading settings...
			</div>
		);
	}

	if (!settings) {
		return (
			<div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
				Error loading settings
			</div>
		);
	}

	return (
		<div style={{ minHeight: "100vh", background: "#fafafa" }}>
			{/* Header */}
			<div style={{
				background: "white",
				borderBottom: "1px solid #e5e5e5",
				padding: "24px 0 0 0",
				boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
			}}>
				<div style={{ maxWidth: "1200px", margin: "0 auto" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
						<SettingsIcon size={28} />
						<div>
							<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>Settings</h1>
							<p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#666" }}>
								Manage your booking preferences and availability
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 0" }}>
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
								<div>
									<h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
										Working Hours
									</h2>
									<p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
										Set the daily time window when you're available for appointments
									</p>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
										<div>
											<label style={{
												display: "block",
												marginBottom: "8px",
												fontSize: "14px",
												fontWeight: 600,
												color: "#222",
											}}>
												Start Hour
											</label>
											<select
												value={settings.workingHours.startHour}
												onChange={(e) =>
													setSettings({
														...settings,
														workingHours: {
															...settings.workingHours,
															startHour: parseInt(e.target.value),
														},
													})
												}
												style={{
													width: "100%",
													padding: "10px 12px",
													border: "1px solid #ddd",
													borderRadius: "6px",
													fontSize: "14px",
													boxSizing: "border-box",
													cursor: "pointer",
												}}
											>
												{HOURS.map((h) => (
													<option key={h} value={h}>
														{String(h).padStart(2, "0")}:00
													</option>
												))}
											</select>
										</div>
										<div>
											<label style={{
												display: "block",
												marginBottom: "8px",
												fontSize: "14px",
												fontWeight: 600,
												color: "#222",
											}}>
												End Hour
											</label>
											<select
												value={settings.workingHours.endHour}
												onChange={(e) =>
													setSettings({
														...settings,
														workingHours: {
															...settings.workingHours,
															endHour: parseInt(e.target.value),
														},
													})
												}
												style={{
													width: "100%",
													padding: "10px 12px",
													border: "1px solid #ddd",
													borderRadius: "6px",
													fontSize: "14px",
													boxSizing: "border-box",
													cursor: "pointer",
												}}
											>
												{HOURS.map((h) => (
													<option key={h} value={h}>
														{String(h).padStart(2, "0")}:00
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
							)}
							{/* Working Days Tab */}
							{activeTab === "days" && (
								<div>
									<h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
										Working Days
									</h2>
									<p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
										Select the days of the week you are available for appointments
									</p>
									<div style={{ display: "flex", gap: "16px" }}>
										<div>
											<label style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>Start Day</label>
											<select
												value={settings.workingDays.startDay}
												onChange={(e) =>
													setSettings({
														...settings,
														workingDays: {
															...settings.workingDays,
															startDay: parseInt(e.target.value),
														},
													})
												}
												style={{
													width: "100%",
													padding: "10px 12px",
													border: "1px solid #ddd",
													borderRadius: "6px",
													fontSize: "14px",
													boxSizing: "border-box",
													cursor: "pointer",
												}}
											>
												{DAYS.map((d, i) => (
													<option key={d} value={i}>
														{d}
													</option>
												))}
											</select>
										</div>
										<div>
											<label style={{ fontSize: "14px", fontWeight: 600, color: "#222" }}>End Day</label>
											<select
												value={settings.workingDays.endDay}
												onChange={(e) =>
													setSettings({
														...settings,
														workingDays: {
															...settings.workingDays,
															endDay: parseInt(e.target.value),
														},
													})
												}
												style={{
													width: "100%",
													padding: "10px 12px",
													border: "1px solid #ddd",
													borderRadius: "6px",
													fontSize: "14px",
													boxSizing: "border-box",
													cursor: "pointer",
												}}
											>
												{DAYS.map((d, i) => (
													<option key={d} value={i}>
														{d}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
							)}
							{/* Blocked Slots Tab */}
							{activeTab === "blocked" && (
								<div>
									<h2 style={{ marginTop: 0, marginBottom: "24px", fontSize: "20px", fontWeight: 700 }}>
										Blocked Time Slots
									</h2>
									<p style={{ marginTop: 0, marginBottom: "20px", fontSize: "14px", color: "#666" }}>
										Add breaks or unavailable times to prevent bookings during those periods
									</p>
									<div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
										<input
											type="time"
											value={newBlockedSlot.startTime}
											onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, startTime: e.target.value })}
											style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
										/>
										<span style={{ fontWeight: 600 }}>to</span>
										<input
											type="time"
											value={newBlockedSlot.endTime}
											onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, endTime: e.target.value })}
											style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px" }}
										/>
										<input
											type="text"
											value={newBlockedSlot.label}
											onChange={(e) => setNewBlockedSlot({ ...newBlockedSlot, label: e.target.value })}
											placeholder="Label (e.g. Lunch)"
											style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", width: "160px" }}
										/>
										<button
											onClick={handleAddBlockedSlot}
											style={{ background: "#222", color: "white", border: "none", borderRadius: "6px", padding: "8px 16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
										>
											<Plus size={16} /> Add
										</button>
									</div>
									<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
										{settings.blockedSlots.map((slot) => (
											<li key={slot._key} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
												<span style={{ fontWeight: 500 }}>{slot.label}:</span>
												<span>{slot.startTime} - {slot.endTime}</span>
												<button
													onClick={() => handleRemoveBlockedSlot(slot._key)}
													style={{ background: "none", border: "none", color: "#e11d48", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
												>
													<Trash2 size={16} /> Remove
												</button>
											</li>
										))}
									</ul>
								</div>
							)}
							{/* Calendar Integration Tab */}
							{activeTab === "calendar" && (
								<div>
									<h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "22px", fontWeight: 700 }}>
										Calendar Integration
									</h2>
									<p style={{ marginTop: 0, marginBottom: "18px", fontSize: "15px", color: "#666" }}>
										Automatically sync your bookings with your calendar and block busy times
									</p>

									{/* Connected Calendars Card */}
									<div style={{
										background: "#fafcff",
										border: "1px solid #e5e7eb",
										borderRadius: "12px",
										padding: "28px 24px 24px 24px",
										marginBottom: "24px",
									}}>
										{calendarConnected && (
											<div style={{
												marginBottom: "18px",
												color: "#22c55e",
												fontWeight: 600,
												fontSize: "16px",
												display: "flex",
												alignItems: "center",
												gap: "8px",
											}}>
												<span style={{fontSize: "18px"}}>✔</span> Google Calendar connected successfully!
											</div>
										)}
										<div style={{ display: "flex", gap: "16px" }}>
											<button
												onClick={handleConnectGoogle}
												disabled={googleConnecting || calendarConnected}
												style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "10px 24px", fontWeight: 600, cursor: googleConnecting || calendarConnected ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}
											>
												<span style={{display: "flex", alignItems: "center"}}><Calendar size={16} /></span>
												Connect Google Calendar
											</button>
											<button
												onClick={handleConnectOutlook}
												disabled={outlookConnecting || outlookConnected}
												style={{ background: "#2563eb", color: "white", border: "none", borderRadius: "6px", padding: "10px 24px", fontWeight: 600, cursor: outlookConnecting || outlookConnected ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "15px" }}
											>
												<span style={{display: "flex", alignItems: "center"}}><Calendar size={16} /></span>
												Connect Outlook Calendar
											</button>
										</div>
									</div>

									{/* Sync Preferences Card */}
									<div style={{
										background: "#f8fafc",
										border: "1px solid #e5e7eb",
										borderRadius: "12px",
										padding: "24px 24px 18px 24px",
										marginBottom: "18px",
									}}>
										<div style={{ fontWeight: 600, fontSize: "16px", marginBottom: "16px" }}>Sync Preferences</div>
										<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
											<label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
												<input
													type="checkbox"
													checked={settings.calendarSync?.autoCreateEvents ?? true}
													onChange={(e) => setSettings({
														...settings,
														calendarSync: {
															...settings.calendarSync,
															autoCreateEvents: e.target.checked,
															showBusyTimes: settings.calendarSync?.showBusyTimes ?? false,
															syncCancellations: settings.calendarSync?.syncCancellations ?? true,
														}
													})}
													style={{ width: "18px", height: "18px", cursor: "pointer" }}
												/>
												<span style={{ color: "#222", fontWeight: 500 }}>
													Auto-create calendar events for new bookings
												</span>
											</label>
											<label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
												<input
													type="checkbox"
													checked={settings.calendarSync?.showBusyTimes ?? false}
													onChange={(e) => setSettings({
														...settings,
														calendarSync: {
															...settings.calendarSync,
															autoCreateEvents: settings.calendarSync?.autoCreateEvents ?? true,
															showBusyTimes: e.target.checked,
															syncCancellations: settings.calendarSync?.syncCancellations ?? true,
														}
													})}
													style={{ width: "18px", height: "18px", cursor: "pointer" }}
												/>
												<span style={{ color: "#222", fontWeight: 500 }}>
													Show busy times from connected calendars
												</span>
											</label>
											<label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
												<input
													type="checkbox"
													checked={settings.calendarSync?.syncCancellations ?? true}
													onChange={(e) => setSettings({
														...settings,
														calendarSync: {
															...settings.calendarSync,
															autoCreateEvents: settings.calendarSync?.autoCreateEvents ?? true,
															showBusyTimes: settings.calendarSync?.showBusyTimes ?? false,
															syncCancellations: e.target.checked,
														}
													})}
													style={{ width: "18px", height: "18px", cursor: "pointer" }}
												/>
												<span style={{ color: "#222", fontWeight: 500 }}>
													Send booking confirmation to calendar organizer
												</span>
											</label>
										</div>
									</div>

									{/* Info Box */}
									<div style={{
										marginTop: "0px",
										padding: "16px",
										background: "#eff6ff",
										border: "1px solid #bfdbfe",
										borderRadius: "8px",
										fontSize: "14px",
										color: "#1e40af",
									}}>
										<strong>💡 Tip:</strong> Once you connect a calendar, all your bookings will be automatically added to it. You can also block times in your calendar to prevent booking conflicts.
									</div>
								</div>
							)}
							{/* Save Button */}
							<div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid #e5e5e5" }}>
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
										}
									}}
								>
									<Save size={16} />
									{saving ? "Saving..." : "Save Settings"}
								</button>
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
