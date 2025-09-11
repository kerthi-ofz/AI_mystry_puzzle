import { useState, useEffect } from "react";
import axios from "axios";
import ThemeInput from "./ThemeInput";
import LoadingStatus from "./LoadingStatus";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../util";

function MysteryGenerator() {
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        let intervalId = null;
        if (jobId && jobStatus === "processing") {
            intervalId = setInterval(() => pollJobStatus(), 3500);
        }
        return () => clearInterval(intervalId);
    }, [jobId, jobStatus]);

    const pollJobStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
            setJobStatus(res.data.status);
            if (res.data.status === "completed" && res.data.case_id) {
                navigate(`/case/${res.data.case_id}`);
            }
            if (res.data.status === "failed") {
                setError(res.data.error || "Generation failed.");
            }
        } catch {
            setError("Failed to poll job status.");
        }
    };

    const generateMystery = async (params) => {
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/cases/create`, params);
            setJobId(res.data.job_id);
            setJobStatus(res.data.status);
        } catch {
            setError("Failed to start generation.");
        }
    };

    if (error) return <div style={{ color: "red", textAlign: "center" }}>{error}</div>;
    if (!jobId) return <ThemeInput onSubmit={generateMystery} />;
    if (jobStatus === "processing") return <LoadingStatus />;
    return null;
}

export default MysteryGenerator;
