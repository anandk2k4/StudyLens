import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #00D9C0 0%, #00B09D 50%, #FF3347 100%)",
          borderRadius: "8px",
          color: "white",
          fontWeight: 800,
          fontSize: "18px",
          letterSpacing: "-1px",
        }}
      >
        S
      </div>
    ),
    {
      ...size,
    }
  );
}
