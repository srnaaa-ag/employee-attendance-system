
export default function UserAvatar({ size = 72, className = "", alt }) {
  const isDecorative = alt === undefined;
  return (
    <img
      src="/avatar-user.png"
      alt={isDecorative ? "" : alt}
      width={size}
      height={size}
      className={className ? `user-avatar ${className}`.trim() : "user-avatar"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
      }}
      {...(isDecorative ? { "aria-hidden": true } : {})}
    />
  );
}
