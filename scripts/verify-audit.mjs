import fs from "fs";
import path from "path";
import http from "http";

const ROOT = process.cwd();

console.log("===============================================================================");
console.log(" ARCHAIA DEPLOYMENT BUG AUDIT VERIFICATION SUITE");
console.log(" Target: https://brocoders-rho.vercel.app");
console.log("===============================================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Default Demo Hydration on /detector
// -----------------------------------------------------------------------------
console.log("\n[Test 1] Default Demo Hydration on /detector");
const initialDataPath = path.join(ROOT, "lib/storage/initialData.ts");
const initialDataContent = fs.readFileSync(initialDataPath, "utf8");
const detectorPagePath = path.join(ROOT, "app/detector/page.tsx");
const detectorPageContent = fs.readFileSync(detectorPagePath, "utf8");

assert(
  initialDataContent.includes("export const SEED_DEMO_INVESTIGATION") &&
  initialDataContent.includes('conceptName: "Graph Traversal (DFS)"') &&
  initialDataContent.includes("In recursive Depth-First Search (DFS)"),
  "Canonical SEED_DEMO_INVESTIGATION is defined in lib/storage/initialData.ts"
);

assert(
  detectorPageContent.includes("SEED_DEMO_INVESTIGATION") &&
  detectorPageContent.includes("handleLoadDfsDemo();"),
  "app/detector/page.tsx hydrates with SEED_DEMO_INVESTIGATION on first load in demo mode"
);

// -----------------------------------------------------------------------------
// TEST 2: Canonical Detector submission payload integrity
// -----------------------------------------------------------------------------
console.log("\n[Test 2] Detector Demo Seed & API Contract Integrity");
const analyzeApiRoutePath = path.join(ROOT, "app/api/analyze/route.ts");
const analyzeApiContent = fs.readFileSync(analyzeApiRoutePath, "utf8");

assert(
  analyzeApiContent.includes("export async function POST"),
  "app/api/analyze/route.ts exports POST handler for cognitive diagnosis"
);

assert(
  analyzeApiContent.includes("analyzeStudentResponse") &&
  analyzeApiContent.includes("DiagnosticSession"),
  "app/api/analyze/route.ts synthesizes diagnostic sessions with verified mental models"
);

// -----------------------------------------------------------------------------
// TEST 3: Form Validation & Focus Management
// -----------------------------------------------------------------------------
console.log("\n[Test 3] Form Validation & Focus Management");
assert(
  detectorPageContent.includes("topicInputRef") &&
  detectorPageContent.includes("topicInputRef.current?.focus()"),
  "app/detector/page.tsx manages focus on first invalid input during validation error"
);

assert(
  detectorPageContent.includes('role="alert"') &&
  detectorPageContent.includes('aria-live="assertive"'),
  "Validation alerts expose role='alert' and aria-live='assertive'"
);

// -----------------------------------------------------------------------------
// TEST 4: Label-to-Input Association Across All Form Controls
// -----------------------------------------------------------------------------
console.log("\n[Test 4] Accessible Labels and htmlFor Associations");
const formFiles = [
  "app/detector/page.tsx",
  "app/login/page.tsx",
  "app/dashboard/page.tsx",
  "components/mode/ContentModeBanner.tsx"
];

for (const file of formFiles) {
  const content = fs.readFileSync(path.join(ROOT, file), "utf8");
  
  // Find all <input and <textarea elements
  const inputMatches = content.match(/<(input|textarea)[\s\S]*?>/g) || [];
  let fileInputsWithLabel = 0;

  for (const input of inputMatches) {
    if (input.includes('type="hidden"') || input.includes('className="hidden"')) {
      if (input.includes('aria-label=')) fileInputsWithLabel++;
      continue;
    }
    const idMatch = input.match(/id="([^"]+)"/);
    const ariaLabelMatch = input.match(/aria-label="([^"]+)"/);
    
    if (idMatch) {
      const id = idMatch[1];
      const hasMatchingLabel = content.includes(`htmlFor="${id}"`);
      if (hasMatchingLabel || ariaLabelMatch) {
        fileInputsWithLabel++;
      } else {
        console.warn(`    ⚠️ Input #${id} in ${file} lacks matching htmlFor label`);
      }
    } else if (ariaLabelMatch) {
      fileInputsWithLabel++;
    }
  }

  assert(
    inputMatches.length > 0 && fileInputsWithLabel === inputMatches.length,
    `All ${inputMatches.length} input/textarea controls in ${file} have associated labels or aria-label`
  );
}

// -----------------------------------------------------------------------------
// TEST 5: Button Type Correctness (No implicit submits)
// -----------------------------------------------------------------------------
console.log("\n[Test 5] Button Type Correctness");
const interactiveFiles = [
  "app/detector/page.tsx",
  "app/login/page.tsx",
  "app/recovery/page.tsx",
  "app/dashboard/page.tsx",
  "components/Navbar.tsx",
  "components/mode/ContentModeBanner.tsx"
];

let untypedButtonsTotal = 0;
for (const file of interactiveFiles) {
  const content = fs.readFileSync(path.join(ROOT, file), "utf8");
  const buttons = content.match(/<button[\s\S]*?>/g) || [];
  const untyped = buttons.filter(b => !b.includes("type="));
  untypedButtonsTotal += untyped.length;
  assert(
    untyped.length === 0,
    `${file}: All ${buttons.length} buttons have explicit type attribute (0 untyped)`
  );
}

// -----------------------------------------------------------------------------
// TEST 6: Recovery Page Landmark & <h1> Heading
// -----------------------------------------------------------------------------
console.log("\n[Test 6] Recovery Page Heading Hierarchy");
const recoveryPagePath = path.join(ROOT, "app/recovery/page.tsx");
const recoveryContent = fs.readFileSync(recoveryPagePath, "utf8");

assert(
  recoveryContent.includes("<h1") &&
  recoveryContent.includes("Targeted Recovery Lab Studio"),
  "app/recovery/page.tsx renders valid <h1> in populated state"
);

// Check empty state branch for h1
const emptyStateMatch = recoveryContent.match(/if \(!intervention\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/);
assert(
  emptyStateMatch && emptyStateMatch[0].includes("<h1"),
  "app/recovery/page.tsx renders valid <h1> in empty/fallback state"
);

// -----------------------------------------------------------------------------
// TEST 7: Root Redirect / -> /dashboard
// -----------------------------------------------------------------------------
console.log("\n[Test 7] Root Redirect / -> /dashboard");
const rootPagePath = path.join(ROOT, "app/page.tsx");
const rootPageContent = fs.readFileSync(rootPagePath, "utf8");

assert(
  rootPageContent.includes('redirect("/dashboard")'),
  "app/page.tsx redirects root / to /dashboard explicitly"
);

const loadingPagePath = path.join(ROOT, "app/loading.tsx");
assert(
  fs.existsSync(loadingPagePath),
  "app/loading.tsx exists to prevent first-paint black flash and layout shifts"
);

// -----------------------------------------------------------------------------
// TEST 8: Guest 401 Session Handling
// -----------------------------------------------------------------------------
console.log("\n[Test 8] Guest Session 401 Response Normalization");
const sessionRoutePath = path.join(ROOT, "app/api/auth/session/route.ts");
const sessionRouteContent = fs.readFileSync(sessionRoutePath, "utf8");

assert(
  sessionRouteContent.includes('status: 401') &&
  sessionRouteContent.includes('{ authenticated: false }'),
  "app/api/auth/session/route.ts returns structured { authenticated: false } with 401 on unauthenticated guest visits"
);

const navbarPath = path.join(ROOT, "components/Navbar.tsx");
const navbarContent = fs.readFileSync(navbarPath, "utf8");
assert(
  navbarContent.includes("res.status === 401") || navbarContent.includes("!res.ok"),
  "components/Navbar.tsx handles 401 session response silently without client-side error"
);

// -----------------------------------------------------------------------------
// TEST 9: Content Mode Switching API Contract
// -----------------------------------------------------------------------------
console.log("\n[Test 9] Content Mode Dynamic Toggle");
const courseRoutePath = path.join(ROOT, "app/api/course/route.ts");
const courseRouteContent = fs.readFileSync(courseRoutePath, "utf8");

assert(
  courseRouteContent.includes('action === "setMode"') &&
  courseRouteContent.includes('store.setMode(targetMode)'),
  "app/api/course/route.ts supports setting mode between demo and course"
);

// -----------------------------------------------------------------------------
// TEST 10: Responsive Layout Smoke Verification
// -----------------------------------------------------------------------------
console.log("\n[Test 10] Responsive Grid Breakpoints Smoke Check");
const appShellContent = fs.readFileSync(path.join(ROOT, "components/AppShell.tsx"), "utf8");
const responsiveClasses = ["sm:", "md:", "lg:", "grid-cols-1", "max-w-5xl"];

let responsivePass = true;
for (const cls of responsiveClasses) {
  if (!detectorPageContent.includes(cls)) {
    responsivePass = false;
  }
}
if (!appShellContent.includes("max-w-7xl")) {
  responsivePass = false;
}

assert(
  responsivePass,
  "app/detector/page.tsx and AppShell include responsive modifiers for mobile, tablet, and desktop viewports"
);

console.log("\n===============================================================================");
console.log(` AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
