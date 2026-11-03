const ICON_PATH = "../assets/images";

// WMO weather interpretation codes, grouped by the icon we have for them.
const CONDITIONS = [
    { codes: [0], icon: "sunny", label: "Clear sky" },
    { codes: [1, 2], icon: "partly-cloudy", label: "Partly cloudy" },
    { codes: [3], icon: "overcast", label: "Overcast" },
    { codes: [45, 48], icon: "fog", label: "Fog" },
    { codes: [51, 53, 55, 56, 57], icon: "drizzle", label: "Drizzle" },
    { codes: [61, 63, 65, 66, 67, 80, 81, 82], icon: "rain", label: "Rain" },
    { codes: [71, 73, 75, 77, 85, 86], icon: "snow", label: "Snow" },
    { codes: [95, 96, 99], icon: "storm", label: "Thunderstorm" },
];

/** Returns { src, label } for a WMO weather code. */
function getCondition(code) {
    const condition = CONDITIONS.find(({ codes }) => codes.includes(code)) ?? CONDITIONS[2];
    return { src: `${ICON_PATH}/icon-${condition.icon}.webp`, label: condition.label };
}
