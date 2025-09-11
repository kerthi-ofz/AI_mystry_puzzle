import { useState } from "react";

function ThemeInput({ onSubmit }) {
    const [theme, setTheme] = useState("");
    const [mysteryType, setMysteryType] = useState("");
    const [setting, setSetting] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!theme || !mysteryType) {
            alert("Please enter both Theme and Mystery Type");
            return;
        }
        onSubmit({ theme, mystery_type: mysteryType, setting });
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
            <input
                type="text"
                placeholder="Theme (e.g., haunted)"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                required
                style={{ width: "100%", marginBottom: 8, padding: 8 }}
            />
            <input
                type="text"
                placeholder="Mystery Type (e.g., murder)"
                value={mysteryType}
                onChange={(e) => setMysteryType(e.target.value)}
                required
                style={{ width: "100%", marginBottom: 8, padding: 8 }}
            />
            <input
                type="text"
                placeholder="Setting (optional)"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                style={{ width: "100%", marginBottom: 8, padding: 8 }}
            />
            <button type="submit" style={{ padding: "8px 16px" }}>
                Generate Mystery
            </button>
        </form>
    );
}

export default ThemeInput;
