function LoadingStatus({ message = "Generating your mystery..." }) {
    return (
        <div style={{ textAlign: "center", marginTop: 50 }}>
            <h2>{message}</h2>
            <div
                style={{
                    margin: "20px auto",
                    border: "6px solid #f3f3f3",
                    borderTop: "6px solid #3498db",
                    borderRadius: "50%",
                    width: 50,
                    height: 50,
                    animation: "spin 1s linear infinite",
                }}
            />
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
}

export default LoadingStatus;
