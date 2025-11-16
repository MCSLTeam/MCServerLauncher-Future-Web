export function snakeToPascal(snakeStr: string) {
  return snakeStr
    .split("_")
    .filter((word) => word.length > 0)
    .map((word) => {
      if (word.length === 0) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}
