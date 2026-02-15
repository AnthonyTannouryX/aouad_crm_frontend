import { Routes, Route, Navigate } from "react-router-dom";

export default function AgentApp() {
    return (
        <div style={{ padding: 24 }}>
            <h1>Agent Panel</h1>

            <Routes>
                <Route path="/" element={<div>Agent Dashboard</div>} />
                <Route path="*" element={<Navigate to="/agent" replace />} />
            </Routes>
        </div>
    );
}
