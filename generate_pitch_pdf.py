import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_footer(num_pages)
            super().showPage()
        super().save()

    def draw_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Lifeline OS — Technical Handover & Sustainability Impact Pitch")
            self.drawRightString(612 - 54, 750, "June 2022 Assam Floods")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(54, 744, 612 - 54, 744)

        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL — EVALUATION DOSSIER | https://lifeline-os-bkp.ai.studio")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, 46, 612 - 54, 46)
        self.restoreState()

def build_pdf(filename="Lifeline_OS_Sustainability_Impact.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0F172A")    # Deep Slate
    accent_blue = colors.HexColor("#0284C7")      # Engineering Cyan/Blue
    dark_gray = colors.HexColor("#334155")        # Body text
    alert_red = colors.HexColor("#DC2626")        # Red alert
    box_bg = colors.HexColor("#F8FAFC")           # Card background
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=accent_blue,
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=accent_blue,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=dark_gray,
        spaceAfter=6
    )

    body_bold = ParagraphStyle(
        'Body_Bold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    box_text_style = ParagraphStyle(
        'BoxText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#0369A1")
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=dark_gray
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=primary_color
    )

    table_cell_alert = ParagraphStyle(
        'TableCellAlert',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=alert_red
    )

    story = []

    # Title Banner
    story.append(Paragraph("LIFELINE OS: DISASTER NETWORK ACCESSIBILITY & STAGING ENGINE", title_style))
    story.append(Paragraph("THEME: Sustainability & Social Impact (Climate Adaptation, Healthcare Equity, Resilient Infrastructure)", subtitle_style))
    story.append(Paragraph("<b>Target System:</b> https://lifeline-os-bkp.ai.studio &nbsp;|&nbsp; <b>Scenario:</b> June 2022 Cachar District / Silchar Floods, Assam &nbsp;|&nbsp; <b>Evaluation Dossier</b>", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceAfter=10))

    # SECTION 1
    story.append(Paragraph("1. THE HUMAN PROBLEM", h1_style))
    story.append(Paragraph(
        "In June 2022, torrential monsoon rains overwhelmed the Barak River basin. Floodwaters submerged over 80% of Silchar town and cut off 300,000 residents across Cachar District. Basic supplies dried up within 48 hours. Pregnant mothers, dialysis patients, and children went without emergency medical access for days.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The ground reality is counterintuitive:</b> Villages do not become isolated because every single road is underwater. In 82% of cut-off settlements, the community itself sits on dry ground. They get stranded because <i>one specific culvert, pipe, or approach ramp</i> washes out at the valley mouth, severing the sole exit route.",
        body_style
    ))
    story.append(Paragraph(
        "<b>Why current navigation systems fail:</b> Commercial routing tools operate reactively. They rely on crowdsourced user reports or post-disaster satellite imagery. An ambulance driver only learns a causeway is underwater after hitting the flood line. Turning around on a single-lane rural embankment burns 40 to 90 minutes. In acute trauma or severe respiratory illness, that lost time proves fatal.",
        body_style
    ))
    story.append(Paragraph(
        "<b>The Sustainability & Social Impact imperative:</b> Climate adaptation is not about building 20-meter seawalls along every rural ditch. Public infrastructure budgets are strictly limited. True climate resilience means locating the exact articulation points—the single bridges and causeways whose failure cuts off tens of thousands of people—and reinforcing them 90 days before the monsoon hits. Public funds go directly to the specific spans that protect the greatest number of human lives.",
        body_style
    ))

    story.append(Spacer(1, 4))

    # SECTION 2
    story.append(Paragraph("2. HOW LIFELINE OS WORKS", h1_style))
    story.append(Paragraph(
        "Lifeline OS combines Synthetic Aperture Radar (SAR) flood footprints with OpenStreetMap road graphs to profile network vulnerability before and during peak flooding. Instead of treating roads as static geometric lines, it runs physical checks on water clearance, axle loads, and bridge approaches.",
        body_style
    ))
    story.append(Paragraph("Technical Receipts & Core Data Architecture:", h2_style))

    story.append(Paragraph("• <b>Base Road Network:</b> Extracted from OpenStreetMap (.pbf) containing <b>31,214 nodes and 69,663 directed edges</b>. The network is projected into <b>UTM Zone 46N (EPSG:32646)</b> so every calculation is measured in Cartesian meters rather than distorted angular degrees.", bullet_style))
    story.append(Paragraph("• <b>Radar Flood Mask:</b> Sourced from European Space Agency (ESA) Sentinel-1 C-Band SAR. Unlike optical satellites, radar penetrates thick cloud cover and driving rain. The engine strips out radar speckle noise by discarding surface water bodies under 5,000 m², leaving genuine inundation fields that sever <b>1,830 road segments</b> across Cachar.", bullet_style))
    story.append(Paragraph("• <b>Bridgehead Ramp Defense (Anti-Stranded Bridge Check):</b> A dry, elevated concrete bridge is functionally useless if the low-lying dirt approach road on either bank is submerged. The spatial engine audits both incident nodes (u and v) for every bridge structure. If approach ramps submerge, it prunes the elevated span. During the 2022 run, the engine pruned <b>163 stranded bridges</b> that naive Dijkstra routers treated as usable.", bullet_style))
    story.append(Paragraph("• <b>Single Points of Failure (Articulation Bridges):</b> Using Tarjan's linear-time <i>O(V+E)</i> articulation bridge algorithm on a 2-edge-connected condensation tree, the system pinpoints <b>183 articulation bridges</b>. Severing any of these spans leaves zero alternative land corridors.", bullet_style))

    story.append(Spacer(1, 6))

    # PLACEHOLDER 1
    p1 = Table([[
        Paragraph("<b>[SCREENSHOT 1: MAIN COMMAND CENTER]</b><br/>Drop in view of Main Command Center showing the 183 Articulation Bridges metric badge, the 4-layer dark matter map, and the JT Road 27-village orange catchment web.", box_text_style)
    ]], colWidths=[504])
    p1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), box_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0284C7")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p1)

    story.append(Spacer(1, 8))

    # SECTION 3
    story.append(Paragraph("3. WHAT HAPPENS ON THE GROUND (THE NUMBERS THAT MATTER)", h1_style))
    story.append(Paragraph(
        "Disaster logistics is governed by structural bottlenecks. When water breaches specific corridors, connectivity collapses non-linearly:",
        body_style
    ))

    t1_data = [
        [Paragraph("Critical Choke Point", table_cell_bold), Paragraph("Breached Span", table_cell_bold), Paragraph("Severed Settlements", table_cell_bold), Paragraph("Population Cut Off", table_cell_bold), Paragraph("Operational Impact", table_cell_bold)],
        [Paragraph("JT Road Corridor", table_cell), Paragraph("3 spans (420 m total)", table_cell), Paragraph("27 villages", table_cell_alert), Paragraph("~39,000 residents", table_cell), Paragraph("Complete land access loss to regional primary hospitals", table_cell)],
        [Paragraph("Harinagar Inbound Link", table_cell), Paragraph("2 spans (380 m total)", table_cell), Paragraph("22 villages", table_cell_alert), Paragraph("~31,000 residents", table_cell), Paragraph("Eastern riverbank access wiped out; requires boat bridge", table_cell)],
        [Paragraph("Sonai Arterial Causeway", table_cell), Paragraph("1 span (110 m)", table_cell), Paragraph("14 villages", table_cell), Paragraph("~20,000 residents", table_cell), Paragraph("Forces 32 km detour over unpaved tea estate tracks", table_cell)],
    ]
    t1 = Table(t1_data, colWidths=[110, 85, 80, 85, 144])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t1)

    story.append(Spacer(1, 6))
    story.append(Paragraph("<b>The Binnakandi Detour Reality:</b> In dry baseline conditions, a patient in Binnakandi travels <b>7.76 km (22.5 minutes)</b> to Silchar Medical College & Hospital (SMCH). When floodwaters breach the primary causeway, land access severs. The ambulance must divert onto a <b>19.44 km perimeter detour taking over 64 minutes</b> through waterlogged bypass roads—tripling emergency transit time.", body_style))
    story.append(Paragraph("<b>Vehicle Physics Matters (Light 4x4 vs. 16-Ton Supply Truck):</b> A light 4x4 ambulance can traverse waterlogged dirt tracks and tolerate narrow shoulders. Heavy multi-axle relief trucks cannot. When evaluating routes for 16-ton supply vehicles, <b>63 narrow (<3.5m) or unpaved tracks fail under heavy axle loads</b>. As a result, the count of totally isolated villages jumps from <b>8 to 19</b>, and the single-corridor failure vulnerability surges from <b>27 to 41 villages</b>.", body_style))

    story.append(Spacer(1, 6))

    # PLACEHOLDER 2
    p2 = Table([[
        Paragraph("<b>[SCREENSHOT 2: COUNTERFACTUAL BRIDGE SIMULATION]</b><br/>Drop in view of the Counterfactual Bridge Simulation tab showing the 27 village pins turning Emerald Green and Max Cut dropping from 27 to 14 after deploying the Bailey bridge on JT Road.", box_text_style)
    ]], colWidths=[504])
    p2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), box_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0284C7")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p2)

    story.append(Spacer(1, 8))

    # SECTION 4
    story.append(Paragraph("4. THE HOSPITAL DOMINO EFFECT (HEALTHCARE EQUITY)", h1_style))
    story.append(Paragraph(
        "Disaster access is systemic. When 16 rural clinics submerge or lose road connectivity, rural patients do not disappear. They redirect onto the few surviving urban facilities, creating severe clinical congestion:",
        body_style
    ))

    t2_data = [
        [Paragraph("Health Facility", table_cell_bold), Paragraph("Normal Status", table_cell_bold), Paragraph("Flood Demand Delta", table_cell_bold), Paragraph("Primary Sources of Inbound Patients", table_cell_bold)],
        [Paragraph("Valley Hospital (Silchar)", table_cell), Paragraph("Operational", table_cell), Paragraph("+191% (CRITICAL SURGE)", table_cell_alert), Paragraph("Binnakandi, Tolengram, Kanakpur, Sonaimukh", table_cell)],
        [Paragraph("South City Hospital", table_cell), Paragraph("Operational", table_cell), Paragraph("+181% (CRITICAL SURGE)", table_cell_alert), Paragraph("Disāma, Harinagar, Meherpur bypass", table_cell)],
        [Paragraph("BPHC Udharbond", table_cell), Paragraph("Operational", table_cell), Paragraph("+168% (SEVERE SURGE)", table_cell_alert), Paragraph("Northern rural perimeter cut-offs", table_cell)],
        [Paragraph("Nightingale Hospital", table_cell), Paragraph("Operational (Physically Dry)", table_cell), Paragraph("-85% (STARVED CLINIC)", table_cell), Paragraph("Facility is staffed and dry, but approach road submerged", table_cell)],
    ]
    t2 = Table(t2_data, colWidths=[120, 100, 114, 170])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t2)

    story.append(Spacer(1, 6))
    story.append(Paragraph("This disparity highlights rural healthcare inequity. Urban facilities face structural collapse under 190% load surges, while fully equipped clinics like Nightingale sit completely empty simply because 200 meters of approach pavement is submerged under 0.6 meters of floodwater.", body_style))

    story.append(Spacer(1, 8))

    # SECTION 5
    story.append(Paragraph("5. TESTING SOLUTIONS BEFORE SPENDING MONEY", h1_style))
    story.append(Paragraph("What-If Counterfactual Bridge Simulator:", h2_style))
    story.append(Paragraph(
        "Instead of guessing where to dispatch engineering battalions, district decision-makers use the <b>What-If Simulator</b> to test temporary modular crossings before committing field crews. Clicking 'Deploy Bailey Bridge' on the severed JT Road causeway recalculates global shortest paths in 120 milliseconds:",
        body_style
    ))
    story.append(Paragraph("1. <b>27 Cut-Off Villages Reconnect Instantly:</b> Map pins turn from amber warning to emerald green.", bullet_style))
    story.append(Paragraph("2. <b>Regional Vulnerability Halves:</b> Max single-point cut risk drops 48%, falling from 27 down to 14 villages.", bullet_style))
    story.append(Paragraph("3. <b>Urban ICU Pressure Dissolves:</b> Reopening the direct 7.76 km route to SMCH pulls rural patients away from overloaded private facilities, dropping patient surge at Valley Hospital from <b>+191% down to +118%</b>—relieving 73% of critical excess demand.", bullet_style))

    story.append(Paragraph("Why We Use Gemini 2.5 Flash (The ARGON Dispatch Engine):", h2_style))
    story.append(Paragraph(
        "Large language models must never be permitted to calculate spatial paths, estimate water levels, or invent coordinates. In Lifeline OS, <b>our deterministic Python graph engine performs 100% of spatial and network math</b>.",
        body_style
    ))
    story.append(Paragraph(
        "Gemini 2.5 Flash acts strictly as a field logistics dispatcher. It ingests the structured telemetry payload (which bridges are already repaired, active fleet mode, remaining isolated settlements, and hospital overload percentages) and outputs an actionable, military-grade operational memo in <b>under 950 milliseconds</b>. It assigns finite state assets—allocating Class-40 Bailey bridges to high-ROI land breaches, 4x4 Mobile ICUs to perimeter roadheads, and NDRF motorized Zodiacs to true deep-water islands.",
        body_style
    ))

    story.append(Spacer(1, 6))

    # PLACEHOLDER 3
    p3 = Table([[
        Paragraph("<b>[SCREENSHOT 3: HEALTHCARE SURGE & GEMINI DISPATCH PLAN]</b><br/>Drop in view of the Healthcare Surge tab showing Valley Hospital demand drop from +191% to +118% and the Gemini 2.5 Flash 3-bullet ARGON dispatch plan.", box_text_style)
    ]], colWidths=[504])
    p3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), box_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0284C7")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p3)

    story.append(Spacer(1, 6))

    # PLACEHOLDER 4
    p4 = Table([[
        Paragraph("<b>[SCREENSHOT 4: ENGINE TELEMETRY DRAWER]</b><br/>Drop in view of the Engine Telemetry Drawer open displaying 31,214 nodes, 69,663 edges, UTM Zone 46N CRS metadata, and raw CSV/JSON export action buttons.", box_text_style)
    ]], colWidths=[504])
    p4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), box_bg),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0284C7")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p4)

    story.append(Spacer(1, 8))

    # SECTION 6
    story.append(Paragraph("6. 3-MINUTE DEMO CHEAT SHEET FOR PRESENTERS", h1_style))
    story.append(Paragraph("Follow this exact step-by-step click script during jury presentations using the 3 Guided Tour buttons:", body_style))

    demo_data = [
        [Paragraph("Time Window", table_cell_bold), Paragraph("Presenter Action (Click & Point)", table_cell_bold), Paragraph("Verbal Script (What to Say to the Judges)", table_cell_bold)],
        [
            Paragraph("0:00 – 0:45<br/><b>The Human Problem</b>", table_cell),
            Paragraph("Click <b>'Tour Step 1: Pre-Disaster Vulnerability'</b>.<br/>Point to the top metrics badge showing 183 Articulation Bridges and the orange catchment area.", table_cell),
            Paragraph("'In June 2022, 300,000 people were cut off in Cachar. But settlements do not flood equally. Standard map apps react only after roads submerge. Look at this orange web: JT Road has three exposed spans. If that single 420-meter corridor breaches, 27 downstream villages—39,000 residents—lose land access instantly.'", table_cell)
        ],
        [
            Paragraph("0:45 – 1:30<br/><b>Topological Defense</b>", table_cell),
            Paragraph("Toggle Fleet Profile to <b>'Heavy Supply (16-Ton Truck)'</b>.<br/>Open Engine Telemetry drawer.", table_cell),
            Paragraph("'Notice what happens when we switch from light 4x4 ambulances to 16-ton food convoys. Sixty-three dirt tracks fail under heavy axle load. Isolated villages jump from 8 to 19, and our max-cut spikes to 41 settlements. Our graph engine models real vehicle physics across 31,214 nodes in metric UTM projection, pruning 163 stranded bridges.'", table_cell)
        ],
        [
            Paragraph("1:30 – 2:15<br/><b>Counterfactual Fix</b>", table_cell),
            Paragraph("Click <b>'Tour Step 2: What-If Simulator'</b>.<br/>Click <b>'Deploy Bailey Bridge on JT Road'</b>.", table_cell),
            Paragraph("'Rather than guessing where to allocate millions in relief funds, district commanders test solutions in advance. Watch JT Road: we deploy a temporary modular Bailey bridge. Instantly, 27 cut-off villages turn emerald green. Regional vulnerability drops by 48 percent.'", table_cell)
        ],
        [
            Paragraph("2:15 – 3:00<br/><b>Systemic Impact & Gemini Dispatch</b>", table_cell),
            Paragraph("Click <b>'Tour Step 3: Healthcare Domino & AI Dispatch'</b>.<br/>Scroll to Valley Hospital metric and click <b>'Generate Dispatch Memo'</b>.", table_cell),
            Paragraph("'The impact ripples across the entire healthcare system. Reopening that single link drops Valley Hospital patient surge from +191% down to +118%, clearing 73% of ICU congestion. Gemini 2.5 Flash acts as our rapid dispatcher, reading the live graph state to deploy boats, 4x4s, and mobile ICU units in under one second. That is predictive climate adaptation.'", table_cell)
        ],
    ]
    t3 = Table(demo_data, colWidths=[80, 160, 264])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t3)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    build_pdf()
