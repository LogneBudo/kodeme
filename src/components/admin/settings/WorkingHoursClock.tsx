import React from "react";

interface WorkingHoursClockProps {
  startTime: string;
  endTime: string;
}

const WorkingHoursClock: React.FC<WorkingHoursClockProps> = ({ startTime, endTime }) => {
  // SVG dimensions and center for the new SVG
  const cx = 256;
  const cy = 256;
  const r = 211; // Use the largest inner circle radius from the SVG

  const toHour = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  };
  const startHour = toHour(startTime);
  const endHour = toHour(endTime);

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const angleRad = (angleDeg - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad)
    };
  }
  function describeArc(cx: number, cy: number, r: number, startHour: number, endHour: number) {
    const startAngle = startHour * 30;
    let endAngle = endHour * 30;
    if (endAngle <= startAngle) {
      endAngle += 360;
    }
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const sweepAngle = endAngle - startAngle;
    const largeArcFlag = sweepAngle > 180 ? "1" : "0";
    return [
      "M", cx, cy,
      "L", start.x, start.y,
      "A", r, r, 0, largeArcFlag, 1, end.x, end.y,
      "Z"
    ].join(" ");
  }
  const sectorPath = startHour !== endHour ? describeArc(cx, cy, r, startHour, endHour) : '';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" shapeRendering="geometricPrecision" textRendering="geometricPrecision"
      imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" viewBox="0 0 512 512" style={{ width: 200, height: 200 }}>
      <path fill="#FF343F" fillRule="nonzero"
        d="M256.001 0C326.69 0 390.69 28.655 437.019 74.982 483.343 121.307 512 185.31 512 255.999c0 70.69-28.657 134.693-74.981 181.018C390.69 483.345 326.69 512 256.001 512c-70.689 0-134.691-28.655-181.019-74.981C28.655 390.69 0 326.689 0 255.999 0 185.31 28.657 121.307 74.982 74.982 121.31 28.655 185.312 0 256.001 0z" />
      <path fill="#D2DADA"
        d="M256.001 25.943c127.055 0 230.056 102.999 230.056 230.056 0 127.057-103.001 230.058-230.056 230.058-127.057 0-230.058-103.001-230.058-230.058 0-127.057 103.001-230.056 230.058-230.056z" />
      <path fill="#E9F2F2"
        d="M256.001 44.295c116.921 0 211.704 94.783 211.704 211.704s-94.783 211.706-211.704 211.706S44.295 372.92 44.295 255.999c0-116.921 94.785-211.704 211.706-211.704z" />
      <path fill="#E6E6E6"
        d="M255.999 244.767c6.204 0 11.235 5.029 11.235 11.234 0 6.203-5.031 11.234-11.235 11.234-6.205 0-11.234-5.031-11.234-11.234 0-6.205 5.029-11.234 11.234-11.234z" />
      {/* Optionally, you can add the sectorPath as a highlighted area on the clock face */}
      {sectorPath && <path fill="#667eea" d={sectorPath} opacity={0.7} />}
      <path fill="#4D4D4D" fillRule="nonzero"
        d="M265.814 436.178c0 5.421-4.396 9.817-9.817 9.817-5.42 0-9.817-4.396-9.817-9.817v-17.591c0-5.421 4.397-9.817 9.817-9.817 5.421 0 9.817 4.396 9.817 9.817v17.591zm88.754-29.013c2.688 4.679 1.074 10.656-3.604 13.344-4.679 2.688-10.656 1.074-13.344-3.605l-8.795-15.236c-2.688-4.678-1.074-10.655 3.605-13.343 4.678-2.688 10.655-1.074 13.343 3.604l8.795 15.236zM157.44 104.826c-2.688-4.678-1.074-10.655 3.604-13.343 4.679-2.688 10.655-1.074 13.343 3.604l8.795 15.237c2.688 4.679 1.074 10.656-3.604 13.344-4.679 2.688-10.656 1.074-13.344-3.604l-8.794-15.238zm259.511 232.787c4.678 2.71 6.275 8.704 3.565 13.382-2.711 4.679-8.704 6.276-13.382 3.566l-15.234-8.799c-4.679-2.71-6.276-8.704-3.566-13.382 2.71-4.679 8.704-6.276 13.383-3.565l15.234 8.798zM95.054 174.384c-4.679-2.711-6.276-8.704-3.566-13.383 2.71-4.678 8.704-6.275 13.383-3.565l15.233 8.796c4.679 2.711 6.276 8.705 3.566 13.383-2.71 4.679-8.704 6.276-13.383 3.566l-15.233-8.797zm341.124 71.833c5.4 0 9.778 4.379 9.778 9.778 0 5.401-4.378 9.778-9.778 9.778l-17.591-.001c-5.401 0-9.778-4.378-9.778-9.778s4.377-9.778 9.778-9.778l17.591.001zM75.822 265.816c-5.42 0-9.817-4.396-9.817-9.817 0-5.42 4.397-9.817 9.817-9.817h17.592c5.42 0 9.817 4.397 9.817 9.817 0 5.421-4.397 9.817-9.817 9.817H75.822zm331.345-108.382c4.678-2.688 10.655-1.074 13.343 3.605 2.688 4.678 1.074 10.655-3.604 13.343l-15.236 8.793c-4.678 2.688-10.655 1.074-13.343-3.605-2.688-4.678-1.075-10.655 3.604-13.343l15.236-8.793zM104.83 354.561c-4.679 2.688-10.656 1.074-13.344-3.604-2.688-4.679-1.074-10.656 3.605-13.344l15.235-8.793c4.679-2.688 10.656-1.074 13.344 3.604 2.688 4.679 1.074 10.656-3.605 13.344l-15.235 8.793zM337.611 95.05c2.71-4.678 8.704-6.276 13.383-3.565 4.678 2.71 6.275 8.704 3.565 13.382l-8.799 15.234c-2.71 4.678-8.703 6.276-13.382 3.565-4.678-2.71-6.276-8.704-3.565-13.382l8.798-15.234zM174.382 416.947c-2.71 4.678-8.704 6.276-13.383 3.565-4.678-2.71-6.275-8.704-3.565-13.382l8.797-15.234c2.71-4.679 8.704-6.276 13.382-3.566 4.679 2.711 6.276 8.705 3.566 13.383l-8.797 15.234zm71.834-341.125c0-5.4 4.378-9.778 9.778-9.778s9.778 4.378 9.778 9.778l-.002 17.592c0 5.4-4.378 9.778-9.778 9.778s-9.778-4.378-9.778-9.778l.002-17.592z" />
    </svg>
  );
};

export default WorkingHoursClock;
