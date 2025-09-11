import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingStatus from "./LoadingStatus";
import MysteryGame from "./MysteryGame";
import { API_BASE_URL } from "../util";

function MysteryLoader() {
    const { id } = useParams();
    const [mystery, setMystery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMystery = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/cases/${id}`);
                setMystery(res.data.data);
            } catch {
                setError("Failed to load mystery case.");
            } finally {
                setLoading(false);
            }
        };
        fetchMystery();
    }, [id]);

    if (loading) return <LoadingStatus message="Loading mystery case..." />;
    if (error)
        return (
            <div style={{ textAlign: "center", color: "red" }}>
                <p>{error}</p>
                <button onClick={() => navigate("/")}>Go Back</button>
            </div>
        );

    return <MysteryGame mystery={mystery} />;
}

export default MysteryLoader;
