type WordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function Wordmark({ className = "", size = "md" }: WordmarkProps) {
  const textSize =
    size === "sm" ? "text-[15px]" : size === "lg" ? "text-[20px]" : "text-[17px]";

  return (
    <span className={`${textSize} font-bold leading-none tracking-tight ${className}`}>
      <span className="text-teal-300">Strat</span>
      <span className="text-white">book</span>
    </span>
  );
}
