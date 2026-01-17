# Working Hours UI Update

## What Changed

Updated the Working Hours settings to use a modern time picker with **hours AND minutes** selection.

### Before
- Only hour selection (09:00, 10:00, etc.)
- Labels: "Start Hour" / "End Hour"

### After
- Hour AND minute selection (09:00, 09:15, 09:30, 09:45, etc.)
- Labels: "Start Time of Day" / "End Time of Day"
- Beautiful gradient time display
- Smooth dual-select UI with hour:minute format

## UI Features

- **Large time display** with gradient background showing selected time
- **Dual selects** for hours (00-23) and minutes (00, 15, 30, 45)
- **Real-time preview** - see your selection immediately
- **Responsive** - adapts to mobile/tablet screens
- **Accessible** - proper ARIA labels and keyboard navigation

## Data Migration

The data format changed from:
```typescript
workingHours: {
  startHour: 9,    // integer
  endHour: 17      // integer
}
```

To:
```typescript
workingHours: {
  startTime: "09:00",  // HH:mm string
  endTime: "17:00"     // HH:mm string
}
```

### For Existing Users

If you have existing settings data, run the migration utility once:

```typescript
import { migrateWorkingHours } from './utils/migrateWorkingHours';

// In your dev console or a one-time script:
await migrateWorkingHours();
```

This will:
1. Convert `startHour` → `startTime` (e.g., 9 → "09:00")
2. Convert `endHour` → `endTime` (e.g., 17 → "17:00")
3. Remove old fields
4. Preserve all other settings

## Testing Checklist

- [ ] Select start time with hours and minutes
- [ ] Select end time with hours and minutes
- [ ] Verify time displays in gradient box
- [ ] Save settings and reload - times persist
- [ ] Check mobile responsive layout
- [ ] Verify booking slots respect new times
- [ ] Test edge cases (00:00, 23:45, etc.)
- [ ] Ensure keyboard navigation works
