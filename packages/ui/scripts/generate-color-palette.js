// 每个级别和目标亮度值
const colorSteps = {
  50: 245,
  100: 230,
  200: 215,
  300: 190,
  400: 155,
  500: 120,
  600: 95,
  700: 80,
  800: 65,
  900: 55,
  950: 40,
};

const bgSteps = {
  0: 255,
  50: 250,
  100: 245,
  200: 230,
  300: 210,
  400: 160,
  500: 115,
  600: 90,
  700: 65,
  800: 40,
  900: 20,
  950: 5,
};

// 颜色定义
const colors = [
  { name: "rose", h: 340, s: 0.9, steps: colorSteps },
  { name: "pink", h: 320, s: 0.9, steps: colorSteps },
  { name: "fuchsia", h: 300, s: 0.9, steps: colorSteps },
  { name: "purple", h: 275, s: 0.9, steps: colorSteps },
  { name: "violet", h: 255, s: 0.9, steps: colorSteps },
  { name: "indigo", h: 240, s: 0.9, steps: colorSteps },
  { name: "blue", h: 220, s: 0.9, steps: colorSteps },
  { name: "sky", h: 200, s: 0.9, steps: colorSteps },
  { name: "cyan", h: 180, s: 0.9, steps: colorSteps },
  { name: "teal", h: 170, s: 0.9, steps: colorSteps },
  { name: "yellow", h: 45, s: 0.9, steps: colorSteps },
  { name: "amber", h: 30, s: 0.9, steps: colorSteps },
  { name: "orange", h: 20, s: 0.9, steps: colorSteps },
  { name: "red", h: 0, s: 0.9, steps: colorSteps },
  { name: "lime", h: 115, s: 0.9, steps: colorSteps },
  { name: "green", h: 140, s: 0.9, steps: colorSteps },
  { name: "emerald", h: 160, s: 0.9, steps: colorSteps },
  { name: "slate", h: 215, s: 0.2, steps: bgSteps },
  { name: "gray", h: 215, s: 0.1, steps: bgSteps },
  { name: "zinc", h: 240, s: 0.05, steps: bgSteps },
  { name: "neutral", h: 0, s: 0, steps: bgSteps },
  { name: "stone", h: 25, s: 0.05, steps: bgSteps },
  { name: "ocean", h: 190, s: 0.15, steps: bgSteps },
];

// 根据ITU-R BT.601计算亮度
function calculateLuminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// HSL转RGB
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hueToRgb(p, q, h / 360 + 1 / 3);
    g = hueToRgb(p, q, h / 360);
    b = hueToRgb(p, q, h / 360 - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 使用二分法找到匹配目标亮度的L值
function findLForTargetLuminance(h, s, targetLuminance) {
  let low = 0;
  let high = 1;
  let l = 0.5;
  let iterations = 0;
  const maxIterations = 20;
  const tolerance = 0.5;

  while (iterations < maxIterations) {
    const [r, g, b] = hslToRgb(h, s, l);
    const luminance = calculateLuminance(r, g, b);

    if (Math.abs(luminance - targetLuminance) < tolerance) {
      return l;
    }

    if (luminance < targetLuminance) {
      low = l;
    } else {
      high = l;
    }

    l = (low + high) / 2;
    iterations++;
  }

  return l;
}

// 生成SCSS颜色映射
function generateScssColorMap() {
  let scssMap = "$colors: (\n";

  colors.forEach((color) => {
    scssMap += `  "${color.name}": (\n`;

    Object.keys(color.steps).forEach((step) => {
      const targetLuminance = color.steps[step];
      const l = findLForTargetLuminance(color.h, color.s, targetLuminance);
      const [r, g, b] = hslToRgb(color.h, color.s, l);

      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

      scssMap += `    ${step}: ${hex},\n`;
    });

    // 移除最后一个逗号
    scssMap = scssMap.slice(0, -2) + "\n";
    scssMap += "  ),\n";
  });

  // 移除最后一个逗号
  scssMap = scssMap.slice(0, -2) + "\n";
  scssMap += ");";

  return scssMap;
}

// 生成并输出SCSS代码
const scssCode = generateScssColorMap();
console.log(scssCode);
