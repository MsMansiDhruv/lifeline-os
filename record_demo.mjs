import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const playwrightPath = 'C:/Users/pmdhr/AppData/Local/npm-cache/_npx/bbb8a2c4738e2b0c/node_modules/playwright-core';
const { chromium } = require(playwrightPath);

const SCREENSHOTS_DIR = 'E:/mansi/hackathon/demo-assets/screenshots';
const VIDEOS_DIR = 'E:/mansi/hackathon/demo-assets/videos';

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function closeAnyOpenModal(page) {
  try {
    const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Close"), svg.lucide-x').first();
    if (await closeBtn.isVisible({ timeout: 1500 })) {
      await closeBtn.click();
      await sleep(1000);
      return;
    }
  } catch {}
  try {
    await page.keyboard.press('Escape');
    await sleep(800);
  } catch {}
}

async function runDemonstration() {
  console.log('=== Starting Lifeline OS Automated Verification & Capture ===');
  
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // 1. App Introduction & Baseline
  console.log('[1/12] Loading Lifeline OS at http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(4000);

  console.log('Capturing: 01_application_overview.png');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_application_overview.png') });

  // 2. Select Supported Flood Incident (Nepal Mountain Flood Scenario)
  console.log('[2/12] Selecting Nepal (Roshi Gorge) flood scenario ...');
  try {
    const nepalBtn = page.locator('button:has-text("Nepal"), button:has-text("NP Nepal")').first();
    if (await nepalBtn.isVisible({ timeout: 3000 })) {
      await nepalBtn.click();
      await sleep(3500);
      console.log('Capturing: 02_incident_selection_nepal.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_incident_selection_nepal.png') });
    }
  } catch (err) {
    console.warn('Nepal scenario button note:', err.message);
  }

  // Return to Silchar, Assam baseline
  console.log('Returning to Silchar (Assam) riverine flood scenario ...');
  try {
    const assamBtn = page.locator('button:has-text("IN Assam"), button:has-text("Silchar")').first();
    if (await assamBtn.isVisible({ timeout: 3000 })) {
      await assamBtn.click();
      await sleep(3000);
    }
  } catch (err) {
    console.warn('Return to Assam note:', err.message);
  }

  // 3. Evidence Status, Source Metadata, Timestamps
  console.log('[3/12] Inspecting Evidence Catalogue & Source Metadata ...');
  try {
    const evidenceBtn = page.locator('button:has-text("Evidence Catalogue (8)"), button:has-text("Evidence")').first();
    if (await evidenceBtn.isVisible({ timeout: 3000 })) {
      await evidenceBtn.click();
      await sleep(2500);
      console.log('Capturing: 03_evidence_catalogue_metadata.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_evidence_catalogue_metadata.png') });
      await closeAnyOpenModal(page);
    }
  } catch (err) {
    console.warn('Evidence Catalogue note:', err.message);
  }

  // 4. Field Evidence Ingestion / Ground Truth Editor
  console.log('[4/12] Opening Field Evidence Editor (Crowdsourced Ground Truth) ...');
  try {
    const reportBtn = page.locator('button:has-text("Submit Ground Report")').first();
    if (await reportBtn.isVisible({ timeout: 3000 })) {
      await reportBtn.click();
      await sleep(2500);
      console.log('Capturing: 04_field_evidence_editor.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_field_evidence_editor.png') });
      await closeAnyOpenModal(page);
    }
  } catch (err) {
    console.warn('Field Evidence Editor note:', err.message);
  }

  // 5. Toggle Map Layers & Satellite Imagery
  console.log('[5/12] Toggling Map Layers (Satellite View) ...');
  try {
    const satBtn = page.locator('button:has-text("Satellite")').first();
    if (await satBtn.isVisible({ timeout: 3000 })) {
      await satBtn.click();
      await sleep(3500);
      console.log('Capturing: 05_satellite_and_map_layers.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_satellite_and_map_layers.png') });

      const darkBtn = page.locator('button:has-text("Dark Canvas"), button:has-text("Map")').first();
      if (await darkBtn.isVisible({ timeout: 2000 })) {
        await darkBtn.click();
        await sleep(1500);
      }
    }
  } catch (err) {
    console.warn('Satellite view toggle note:', err.message);
  }

  // 6. Chapter 1 & 2: Flood Impact & Hydrology Swell Analysis
  console.log('[6/12] Chapter 2: Hydrology Model & Flood Stage Simulation ...');
  try {
    const predictBtn = page.locator('button:has-text("2. Predict"), button:has-text("Predict")').first();
    if (await predictBtn.isVisible({ timeout: 3000 })) {
      await predictBtn.click();
      await sleep(3000);
      console.log('Capturing: 06_flood_impact_analysis.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_flood_impact_analysis.png') });
    }
  } catch (err) {
    console.warn('Chapter 2 Predict note:', err.message);
  }

  // 7. Chapter 3: Route Disruption, Fleet Weight Constraints & Hospital Surge
  console.log('[7/12] Chapter 3: Protect (Route Disruption & Hospital Detour) ...');
  try {
    const protectBtn = page.locator('button:has-text("3. Protect"), button:has-text("Protect")').first();
    if (await protectBtn.isVisible({ timeout: 3000 })) {
      await protectBtn.click();
      await sleep(3000);

      // Attempt to toggle ambulance rerouting or 16T truck
      try {
        const rerouteToggle = page.locator('button:has-text("Reroute Ambulances"), button:has-text("Reroute")').first();
        if (await rerouteToggle.isVisible({ timeout: 2000 })) {
          await rerouteToggle.click();
          await sleep(1500);
        }
      } catch {}

      console.log('Capturing: 07_route_disruption_hospital_surge.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_route_disruption_hospital_surge.png') });
    }
  } catch (err) {
    console.warn('Chapter 3 Protect note:', err.message);
  }

  // 8. Chapter 4: Resource Allocation & ROI Planner
  console.log('[8/12] Chapter 4: Respond (Resource Allocation & Warehouse Stock Caps) ...');
  try {
    const respondBtn = page.locator('button:has-text("4. Respond"), button:has-text("Respond")').first();
    if (await respondBtn.isVisible({ timeout: 3000 })) {
      await respondBtn.click();
      await sleep(3000);

      // Click Bailey Bridge or Auto-recommend if available
      try {
        const autoRecBtn = page.locator('button:has-text("Auto-Recommend"), button:has-text("Recommend"), button:has-text("Auto-Optimizer")').first();
        if (await autoRecBtn.isVisible({ timeout: 2000 })) {
          await autoRecBtn.click();
          await sleep(2000);
        }
      } catch {}

      console.log('Capturing: 08_resource_planner_roi.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_resource_planner_roi.png') });
    }
  } catch (err) {
    console.warn('Chapter 4 Respond note:', err.message);
  }

  // 9. SDRF Form-3B Official Sanction Order & Audit Trail
  console.log('[9/12] Inspecting Official Sanction Order (SDRF Form-3B) ...');
  try {
    const sanctionBtn = page.locator('button:has-text("SDRF Form-3B"), button:has-text("Sanction Order"), button:has-text("Sign & Launch"), button:has-text("Preview Official Sanction Order")').first();
    if (await sanctionBtn.isVisible({ timeout: 3000 })) {
      await sanctionBtn.click();
      await sleep(2500);
      console.log('Capturing: 09_sanction_order_audit_trail.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_sanction_order_audit_trail.png') });
      await closeAnyOpenModal(page);
    }
  } catch (err) {
    console.warn('Sanction Order note:', err.message);
  }

  // 10. Simulated Emergency Broadcast
  console.log('[10/12] Demonstrating Clearly-Labelled Simulated Emergency Alert ...');
  try {
    const alertBtn = page.locator('button:has-text("Phone Alert"), button:has-text("Simulate Live Phone Alert"), button:has-text("Broadcast")').first();
    if (await alertBtn.isVisible({ timeout: 2000 })) {
      await alertBtn.click();
      await sleep(2000);
      console.log('Capturing: 10_simulated_alert.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_simulated_alert.png') });
      await closeAnyOpenModal(page);
    } else {
      // In Chapter 4, inspect the emergency broadcast accordion / panel
      console.log('Capturing: 10_simulated_alert.png from Chapter 4 dispatch view');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_simulated_alert.png') });
    }
  } catch (err) {
    console.warn('Simulated alert note:', err.message);
  }

  // 11. Architecture & Flow Modal
  console.log('[11/12] Opening Architecture & System Flow modal ...');
  try {
    const archBtn = page.locator('button:has-text("Architecture & Flow"), button:has-text("Architecture")').first();
    if (await archBtn.isVisible({ timeout: 3000 })) {
      await archBtn.click();
      await sleep(2500);
      console.log('Capturing: 11_system_architecture.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_system_architecture.png') });
      await closeAnyOpenModal(page);
    }
  } catch (err) {
    console.warn('Architecture modal note:', err.message);
  }

  // 12. Chapter 5: Learn (Audit Trail & After-Action Review)
  console.log('[12/12] Navigating to Chapter 5 (Learn / Audit Trail) ...');
  try {
    const learnBtn = page.locator('button:has-text("5. Learn"), button:has-text("Learn")').first();
    if (await learnBtn.isVisible({ timeout: 3000 })) {
      await learnBtn.click();
      await sleep(3000);
      console.log('Capturing: 12_audit_trail_and_learning.png');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_audit_trail_and_learning.png') });
    }
  } catch (err) {
    console.warn('Chapter 5 Learn note:', err.message);
  }

  // Complete and flush recording
  console.log('Finalizing capture and saving continuous video stream...');
  await sleep(3000);

  const video = page.video();
  const videoPath = video ? await video.path() : null;

  await page.close();
  await context.close();
  await browser.close();

  console.log('--- Demonstration capture successfully finished! ---');
  if (videoPath) {
    console.log('Video saved to:', videoPath);
  }
}

runDemonstration().catch((err) => {
  console.error('Demonstration execution error:', err);
  process.exit(1);
});
