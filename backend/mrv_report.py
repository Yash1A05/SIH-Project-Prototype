# =========================================================
# BLUE CARBON MRV - REPORT GENERATION
# =========================================================

import os
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
)

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing


# =========================================================
# CONFIGURATION
# =========================================================

REPORTS_FOLDER = "data/reports"
SENTINEL_IMAGE = "data/aoi_sentinel2.png"

os.makedirs(
    REPORTS_FOLDER,
    exist_ok=True
)


# =========================================================
# COLORS
# =========================================================

DARK_GREEN = colors.HexColor("#126B38")
GREEN = colors.HexColor("#1B7A3E")

LIGHT_GREEN = colors.HexColor("#EAF7EE")

DARK_BLUE = colors.HexColor("#17365D")
LIGHT_BLUE = colors.HexColor("#EEF5FB")

DARK_GRAY = colors.HexColor("#374151")
LIGHT_GRAY = colors.HexColor("#F5F7F9")

BORDER_GRAY = colors.HexColor("#D1D5DB")

WARNING_BG = colors.HexColor("#FFF7D6")
WARNING_BORDER = colors.HexColor("#EAB308")

WHITE = colors.white
BLACK = colors.black


# =========================================================
# PAGE HEADER / FOOTER
# =========================================================

def draw_page(canvas, doc):

    canvas.saveState()

    width, height = A4

    # -----------------------------------------------------
    # TOP GREEN LINE
    # -----------------------------------------------------

    canvas.setStrokeColor(DARK_GREEN)
    canvas.setLineWidth(2)

    canvas.line(
        18 * mm,
        height - 15 * mm,
        width - 18 * mm,
        height - 15 * mm
    )

    # -----------------------------------------------------
    # HEADER
    # -----------------------------------------------------

    canvas.setFont(
        "Helvetica-Bold",
        8
    )

    canvas.setFillColor(
        DARK_GREEN
    )

    canvas.drawString(
        18 * mm,
        height - 11 * mm,
        "BLUE CARBON MRV"
    )

    canvas.setFont(
        "Helvetica",
        7
    )

    canvas.setFillColor(
        DARK_GRAY
    )

    canvas.drawRightString(
        width - 18 * mm,
        height - 11 * mm,
        "Automated Screening Report"
    )

    # -----------------------------------------------------
    # FOOTER LINE
    # -----------------------------------------------------

    canvas.setStrokeColor(
        BORDER_GRAY
    )

    canvas.setLineWidth(
        0.5
    )

    canvas.line(
        18 * mm,
        14 * mm,
        width - 18 * mm,
        14 * mm
    )

    # -----------------------------------------------------
    # FOOTER TEXT
    # -----------------------------------------------------

    canvas.setFont(
        "Helvetica",
        7
    )

    canvas.setFillColor(
        DARK_GRAY
    )

    canvas.drawString(
        18 * mm,
        9 * mm,
        "Blue Carbon MRV - Environmental Evidence & Carbon Estimation"
    )

    canvas.drawRightString(
        width - 18 * mm,
        9 * mm,
        f"Page {doc.page}"
    )

    canvas.restoreState()


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def safe_value(
    value,
    default="N/A"
):

    if value is None:
        return default

    return value


# ---------------------------------------------------------
# FORMAT AOI LOCATION
# ---------------------------------------------------------

def format_aoi_location(value):
    """Return a clean human-readable AOI address for the PDF."""
    if not value:
        return "Location not available"

    if isinstance(value, dict):
        display_name = value.get("display_name")
        if display_name:
            return str(display_name).strip()

        parts = []
        for key in ("village", "town", "city", "district", "state", "country"):
            item = value.get(key)
            if item:
                item = str(item).strip()
                if item not in parts:
                    parts.append(item)

        if parts:
            return ", ".join(parts)

        return "Location not available"

    return str(value).strip()


# ---------------------------------------------------------
# FORMAT NUMBER
# ---------------------------------------------------------

def format_number(
    value,
    decimals=2
):

    try:

        if value is None:
            return "N/A"

        return f"{float(value):,.{decimals}f}"

    except Exception:

        return str(value)


# ---------------------------------------------------------
# CREATE QR
# ---------------------------------------------------------

def create_qr(
    verification_url
):

    # QR contains the verification URL so scanning it can open
    # the report verification page.
    qr_code = qr.QrCodeWidget(
        verification_url
    )

    bounds = qr_code.getBounds()

    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]

    drawing = Drawing(
        55,
        55,
        transform=[
            55 / width,
            0,
            0,
            55 / height,
            0,
            0
        ]
    )

    drawing.add(
        qr_code
    )

    return drawing


# =========================================================
# MAIN REPORT FUNCTION
# =========================================================

def generate_mrv_report(
    data
):

    # =====================================================
    # REPORT ID
    # =====================================================

    now = datetime.now()

    report_id = (
        f"BCMRV-{now.strftime('%Y%m%d-%H%M%S')}"
    )

    report_file = os.path.join(
        REPORTS_FOLDER,
        f"MRV_Report_{report_id}.pdf"
    )

    # -----------------------------------------------------
    # QR VERIFICATION URL
    # -----------------------------------------------------
    # Local development URL. When the backend is deployed,
    # replace 127.0.0.1 with the public backend domain.
    # -----------------------------------------------------
    # QR URL:
    # Set MRV_PUBLIC_URL to the PC's LAN/public URL when scanning
    # from another device. Example:
    # MRV_PUBLIC_URL=http://192.168.1.5:5000
    verification_base_url = os.getenv(
        "MRV_PUBLIC_URL",
        "http://127.0.0.1:5000"
    ).rstrip("/")

    verification_url = (
        f"{verification_base_url}/verify/{report_id}"
    )

    # =====================================================
    # DATA EXTRACTION
    # =====================================================

    if not isinstance(data, dict):

        raise ValueError(
            "Invalid analysis data received."
        )

    # -----------------------------------------------------
    # AOI
    # -----------------------------------------------------

    polygon = data.get(
        "polygon",
        []
    )

    # -----------------------------------------------------
    # AOI LOCATION / ADDRESS
    # -----------------------------------------------------
    # Uses the reverse-geocoded address sent by the backend.
    # -----------------------------------------------------
    aoi_location = format_aoi_location(
        data.get(
            "aoi_location",
            data.get("location")
        )
    )
    aoi_location_pdf = escape(aoi_location)

    # -----------------------------------------------------
    # STATISTICS
    # -----------------------------------------------------

    statistics = data.get(
        "statistics",
        {}
    )

    # -----------------------------------------------------
    # MANGROVE
    # -----------------------------------------------------

    mangrove = data.get(
        "mangrove_screening",
        {}
    )

    # -----------------------------------------------------
    # CARBON
    # -----------------------------------------------------

    carbon = data.get(
        "carbon_estimation",
        {}
    )

    # -----------------------------------------------------
    # SENTINEL IMAGE
    # -----------------------------------------------------

    sentinel_image = data.get(
        "sentinel_image",
        SENTINEL_IMAGE
    )

    # =====================================================
    # IMPORTANT:
    # NORMALIZE INDEX DATA
    #
    # sentinel_indices.py returns:
    #
    # statistics["ndvi"]["mean"]
    # statistics["ndvi"]["minimum"]
    # statistics["ndvi"]["maximum"]
    #
    # =====================================================

    ndvi = statistics.get(
        "ndvi",
        {}
    )

    ndwi = statistics.get(
        "ndwi",
        {}
    )

    ndmi = statistics.get(
        "ndmi",
        {}
    )

    # =====================================================
    # NORMALIZE CARBON DATA
    #
    # carbon_estimation.py returns:
    #
    # mangrove_area_hectares
    # carbon_stock_factor_t_c_per_ha
    # estimated_carbon_tonnes
    # estimated_co2e_tonnes
    #
    # =====================================================

    carbon_area = carbon.get(
        "mangrove_area_hectares"
    )

    carbon_factor = carbon.get(
        "carbon_stock_factor_t_c_per_ha"
    )

    estimated_carbon = carbon.get(
        "estimated_carbon_tonnes"
    )

    estimated_co2e = carbon.get(
        "estimated_co2e_tonnes"
    )

    # =====================================================
    # DOCUMENT
    # =====================================================

    doc = SimpleDocTemplate(

        report_file,

        pagesize=A4,

        rightMargin=18 * mm,
        leftMargin=18 * mm,

        topMargin=22 * mm,
        bottomMargin=20 * mm,

        title="Blue Carbon MRV Report",

        author="Blue Carbon MRV System"

    )

    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()

    # -----------------------------------------------------
    # TITLE
    # -----------------------------------------------------

    title_style = ParagraphStyle(

        "ReportTitle",

        parent=styles["Title"],

        fontName="Helvetica-Bold",

        fontSize=22,

        leading=26,

        alignment=TA_CENTER,

        textColor=DARK_GREEN,

        spaceAfter=5

    )

    # -----------------------------------------------------
    # SUBTITLE
    # -----------------------------------------------------

    subtitle_style = ParagraphStyle(

        "Subtitle",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=10,

        leading=14,

        alignment=TA_CENTER,

        textColor=DARK_GRAY,

        spaceAfter=6

    )

    # -----------------------------------------------------
    # REPORT ID
    # -----------------------------------------------------

    report_id_style = ParagraphStyle(

        "ReportID",

        parent=styles["Normal"],

        fontName="Helvetica-Bold",

        fontSize=8.5,

        leading=12,

        alignment=TA_CENTER,

        textColor=DARK_BLUE

    )

    # -----------------------------------------------------
    # SECTION
    # -----------------------------------------------------

    section_style = ParagraphStyle(

        "Section",

        parent=styles["Heading2"],

        fontName="Helvetica-Bold",

        fontSize=15,

        leading=18,

        textColor=DARK_GREEN,

        spaceBefore=8,

        spaceAfter=7

    )

    # -----------------------------------------------------
    # SUBHEADING
    # -----------------------------------------------------

    subheading_style = ParagraphStyle(

        "Subheading",

        parent=styles["Heading3"],

        fontName="Helvetica-Bold",

        fontSize=10,

        textColor=DARK_BLUE,

        spaceBefore=5,

        spaceAfter=4

    )

    # -----------------------------------------------------
    # NORMAL
    # -----------------------------------------------------

    normal_style = ParagraphStyle(

        "NormalCustom",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=9,

        leading=13,

        textColor=BLACK

    )

    # -----------------------------------------------------
    # LOCATION
    # -----------------------------------------------------

    # Compact style for long reverse-geocoded addresses.
    # Paragraph automatically wraps the address inside the
    # table cell instead of allowing it to run outside.
    location_style = ParagraphStyle(
        "Location",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=BLACK,
        wordWrap="CJK",
    )

    # -----------------------------------------------------
    # SMALL
    # -----------------------------------------------------

    small_style = ParagraphStyle(

        "Small",

        parent=styles["Normal"],

        fontName="Helvetica",

        fontSize=7.5,

        leading=10,

        textColor=DARK_GRAY

    )

    # -----------------------------------------------------
    # IMPORTANT
    # -----------------------------------------------------

    important_style = ParagraphStyle(

        "Important",

        parent=styles["Normal"],

        fontName="Helvetica-Bold",

        fontSize=9,

        leading=13,

        textColor=DARK_GREEN

    )

    # =====================================================
    # STORY
    # =====================================================

    story = []

    # =====================================================
    # COVER / HEADER
    # =====================================================

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    story.append(
        Paragraph(
            "BLUE CARBON MRV REPORT",
            title_style
        )
    )

    story.append(
        Paragraph(
            "Mangrove Monitoring, Reporting and Verification",
            subtitle_style
        )
    )

    story.append(
        Paragraph(
            f"Report ID: {report_id}",
            report_id_style
        )
    )

    story.append(
        Paragraph(
            f"Generated on: {now.strftime('%d %B %Y, %H:%M')}",
            report_id_style
        )
    )

    story.append(
        Spacer(
            1,
            8 * mm
        )
    )

    # =====================================================
    # 1. AREA OF INTEREST
    # =====================================================

    story.append(
        Paragraph(
            "1. Area of Interest (AOI)",
            section_style
        )
    )

    aoi_table_data = [

        [
            Paragraph(
                "<b>Parameter</b>",
                normal_style
            ),

            Paragraph(
                "<b>Value</b>",
                normal_style
            )
        ],

        [
            "Polygon Points",
            str(len(polygon))
        ],

        [
            "Analysis Status",
            safe_value(
                data.get(
                    "status",
                    "success"
                )
            )
        ],

        [
            "AOI Location",
            Paragraph(
                aoi_location_pdf,
                location_style
            )
        ],

    ]

    aoi_table = Table(
        aoi_table_data,
        colWidths=[
            45 * mm,
            125 * mm
        ]
    )

    aoi_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                DARK_GREEN
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                WHITE
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER_GRAY
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8.5
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

        ])

    )

    story.append(
        aoi_table
    )

    story.append(
        Spacer(
            1,
            3 * mm
        )
    )

    location_box = Table(
        [
            [
                Paragraph("<b>Selected AOI Location</b>", normal_style),
                Paragraph(aoi_location_pdf, location_style)
            ]
        ],
        colWidths=[
            50 * mm,
            120 * mm
        ]
    )

    location_box.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREEN),
            ("BOX", (0, 0), (-1, -1), 0.7, GREEN),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])
    )

    story.append(location_box)

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    # =====================================================
    # AOI COORDINATES
    # =====================================================

    story.append(
        Paragraph(
            "AOI Coordinates",
            subheading_style
        )
    )

    coordinate_data = [

        [
            Paragraph(
                "<b>Point</b>",
                normal_style
            ),

            Paragraph(
                "<b>Latitude</b>",
                normal_style
            ),

            Paragraph(
                "<b>Longitude</b>",
                normal_style
            )
        ]

    ]

    for index, point in enumerate(
        polygon,
        start=1
    ):

        lat = point.get(
            "lat",
            "N/A"
        )

        lng = point.get(
            "lng",
            "N/A"
        )

        try:

            lat = f"{float(lat):.6f}"
            lng = f"{float(lng):.6f}"

        except Exception:

            pass

        coordinate_data.append(

            [
                str(index),
                lat,
                lng
            ]

        )

    coordinate_table = Table(

        coordinate_data,

        colWidths=[
            25 * mm,
            70 * mm,
            75 * mm
        ]

    )

    coordinate_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                DARK_GREEN
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                WHITE
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER_GRAY
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5
            ),

        ])

    )

    story.append(
        coordinate_table
    )

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    # =====================================================
    # 2. SENTINEL-2 DATA
    # =====================================================

    # Start Sentinel-2 section on a fresh page so the
    # heading/text/image stay together professionally.
    story.append(PageBreak())

    story.append(
        Paragraph(
            "2. Sentinel-2 Satellite Data",
            section_style
        )
    )

    story.append(
        Paragraph(
            "<b>Sentinel-2 imagery acquired successfully.</b>",
            normal_style
        )
    )

    story.append(
        Spacer(
            1,
            3 * mm
        )
    )

    if os.path.exists(
        sentinel_image
    ):

        img = Image(
            sentinel_image
        )

        max_width = 165 * mm
        max_height = 90 * mm

        ratio = min(

            max_width / img.imageWidth,

            max_height / img.imageHeight

        )

        img.drawWidth = (
            img.imageWidth * ratio
        )

        img.drawHeight = (
            img.imageHeight * ratio
        )

        story.append(
            img
        )

    else:

        story.append(
            Paragraph(
                "Sentinel-2 image file was not available.",
                normal_style
            )
        )

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    # =====================================================
    # 3. ENVIRONMENTAL INDICES
    # =====================================================

    story.append(
        Paragraph(
            "3. Environmental Indices",
            section_style
        )
    )

    # -----------------------------------------------------
    # IMPORTANT FIX:
    #
    # Use:
    # mean
    # minimum
    # maximum
    #
    # NOT:
    # min
    # max
    # -----------------------------------------------------

    indices_table_data = [

        [
            Paragraph(
                "<b>Index</b>",
                normal_style
            ),

            Paragraph(
                "<b>Mean</b>",
                normal_style
            ),

            Paragraph(
                "<b>Minimum</b>",
                normal_style
            ),

            Paragraph(
                "<b>Maximum</b>",
                normal_style
            )

        ],

        [
            "NDVI",

            format_number(
                ndvi.get(
                    "mean"
                ),
                4
            ),

            format_number(
                ndvi.get(
                    "minimum"
                ),
                4
            ),

            format_number(
                ndvi.get(
                    "maximum"
                ),
                4
            )

        ],

        [
            "NDWI",

            format_number(
                ndwi.get(
                    "mean"
                ),
                4
            ),

            format_number(
                ndwi.get(
                    "minimum"
                ),
                4
            ),

            format_number(
                ndwi.get(
                    "maximum"
                ),
                4
            )

        ],

        [
            "NDMI",

            format_number(
                ndmi.get(
                    "mean"
                ),
                4
            ),

            format_number(
                ndmi.get(
                    "minimum"
                ),
                4
            ),

            format_number(
                ndmi.get(
                    "maximum"
                ),
                4
            )

        ]

    ]

    indices_table = Table(

        indices_table_data,

        colWidths=[
            35 * mm,
            45 * mm,
            45 * mm,
            45 * mm
        ]

    )

    indices_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                DARK_GREEN
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                WHITE
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER_GRAY
            ),

            (
                "ALIGN",
                (1, 1),
                (-1, -1),
                "CENTER"
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

        ])

    )

    story.append(
        indices_table
    )

    # =====================================================
    # PAGE BREAK
    # =====================================================

    story.append(
        PageBreak()
    )

    # =====================================================
    # 4. MANGROVE SCREENING
    # =====================================================

    story.append(
        Paragraph(
            "4. Mangrove Screening",
            section_style
        )
    )

    mangrove_table_data = [

        [
            Paragraph(
                "<b>Parameter</b>",
                normal_style
            ),

            Paragraph(
                "<b>Value</b>",
                normal_style
            )

        ],

        [
            "Valid Pixels",

            format_number(
                mangrove.get(
                    "valid_pixels"
                ),
                0
            )

        ],

        [
            "Potential Mangrove Pixels",

            format_number(
                mangrove.get(
                    "potential_mangrove_pixels"
                ),
                0
            )

        ],

        [
            "Potential Mangrove Percentage",

            f"{format_number(
                mangrove.get(
                    "potential_mangrove_percentage"
                ),
                2
            )} %"

        ],

        [
            "Potential Mangrove Area",

            f"{format_number(
                mangrove.get(
                    "potential_mangrove_area_hectares"
                ),
                4
            )} ha"

        ]

    ]

    mangrove_table = Table(

        mangrove_table_data,

        colWidths=[
            90 * mm,
            80 * mm
        ]

    )

    mangrove_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                DARK_GREEN
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                WHITE
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER_GRAY
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8.5
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                6
            ),

        ])

    )

    story.append(
        mangrove_table
    )

    story.append(
        Spacer(
            1,
            7 * mm
        )
    )

    # =====================================================
    # SCREENING SUMMARY
    # =====================================================

    screening_percentage = mangrove.get(
        "potential_mangrove_percentage"
    )

    screening_area = mangrove.get(
        "potential_mangrove_area_hectares"
    )

    screening_text = (

        f"<b>Potential mangrove area identified:</b> "

        f"{format_number(
            screening_area,
            4
        )} ha "

        f"({format_number(
            screening_percentage,
            2
        )}% of valid pixels)."

    )

    screening_box = Table(

        [
            [
                Paragraph(
                    screening_text,
                    normal_style
                )
            ]
        ],

        colWidths=[
            170 * mm
        ]

    )

    screening_box.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                LIGHT_GREEN
            ),

            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.8,
                GREEN
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

        ])

    )

    story.append(
        screening_box
    )

    # =====================================================
    # 5. CARBON ESTIMATION
    # =====================================================

    story.append(
        Paragraph(
            "5. Carbon Estimation",
            section_style
        )
    )

    # -----------------------------------------------------
    # IMPORTANT FIX:
    #
    # Actual carbon_estimation.py keys:
    #
    # mangrove_area_hectares
    # carbon_stock_factor_t_c_per_ha
    # estimated_carbon_tonnes
    # estimated_co2e_tonnes
    #
    # -----------------------------------------------------

    carbon_table_data = [

        [
            Paragraph(
                "<b>Parameter</b>",
                normal_style
            ),

            Paragraph(
                "<b>Value</b>",
                normal_style
            )

        ],

        [
            "Mangrove Area",

            f"{format_number(
                carbon_area,
                4
            )} ha"

        ],

        [
            "Carbon Stock Factor",

            f"{format_number(
                carbon_factor,
                1
            )} t C/ha"

        ],

        [
            "Estimated Carbon Stock",

            Paragraph(
                f"<b>{format_number(
                    estimated_carbon,
                    2
                )} t C</b>",

                important_style
            )

        ],

        [
            "Estimated CO2 Equivalent",

            Paragraph(
                f"<b>{format_number(
                    estimated_co2e,
                    2
                )} t CO2e</b>",

                important_style
            )

        ]

    ]

    carbon_table = Table(

        carbon_table_data,

        colWidths=[
            90 * mm,
            80 * mm
        ]

    )

    carbon_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                DARK_GREEN
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                WHITE
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                BORDER_GRAY
            ),

            (
                "BACKGROUND",
                (0, 3),
                (-1, 4),
                LIGHT_GREEN
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8.5
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

        ])

    )

    story.append(
        carbon_table
    )

    story.append(
        Spacer(
            1,
            8 * mm
        )
    )

    # =====================================================
    # KEY RESULT
    # =====================================================

    key_result = Table(

        [
            [

                Paragraph(
                    "<b>KEY RESULT</b>",
                    important_style
                ),

                Paragraph(
                    f"<b>{format_number(
                        estimated_carbon,
                        2
                    )} t C</b>",

                    important_style
                ),

                Paragraph(
                    f"<b>{format_number(
                        estimated_co2e,
                        2
                    )} t CO2e</b>",

                    important_style
                )

            ]
        ],

        colWidths=[
            45 * mm,
            62.5 * mm,
            62.5 * mm
        ]

    )

    key_result.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                LIGHT_GREEN
            ),

            (
                "BOX",
                (0, 0),
                (-1, -1),
                1,
                GREEN
            ),

            (
                "ALIGN",
                (0, 0),
                (-1, -1),
                "CENTER"
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                9
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                9
            ),

        ])

    )

    story.append(
        key_result
    )

    story.append(
        Spacer(
            1,
            8 * mm
        )
    )

    # =====================================================
    # 6. METHODOLOGY
    # =====================================================

    story.append(
        Paragraph(
            "6. Methodology",
            section_style
        )
    )

    methodology_data = [

        [
            Paragraph(
                "<b>Methodology:</b> "
                "Area-based mangrove ecosystem carbon stock estimate.",

                normal_style
            )
        ],

        [
            Paragraph(
                "<b>Carbon Stock Source:</b> "
                "Global Mangrove Alliance - "
                "State of the World's Mangroves 2024.",

                normal_style
            )
        ],

        [
            Paragraph(
                "<b>Carbon Stock Scope:</b> "
                "Living biomass + carbon in top 1 m of soil.",

                normal_style
            )
        ],

    ]

    methodology_table = Table(

        methodology_data,

        colWidths=[
            170 * mm
        ]

    )

    methodology_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                LIGHT_BLUE
            ),

            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.6,
                DARK_BLUE
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7
            ),

        ])

    )

    story.append(
        methodology_table
    )

    story.append(
        Spacer(
            1,
            6 * mm
        )
    )

    # =====================================================
    # IMPORTANT DISCLAIMER
    # =====================================================

    warning_text = (

        "<b>Important:</b> This is a screening estimate. "

        "Field validation and site-specific carbon factors "

        "are required for higher-accuracy MRV."

    )

    warning_box = Table(

        [
            [
                Paragraph(
                    warning_text,
                    normal_style
                )
            ]
        ],

        colWidths=[
            170 * mm
        ]

    )

    warning_box.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                WARNING_BG
            ),

            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.8,
                WARNING_BORDER
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                10
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

        ])

    )

    story.append(
        warning_box
    )

    story.append(
        Spacer(
            1,
            8 * mm
        )
    )

    # =====================================================
    # REPORT VERIFICATION
    # =====================================================

    verification_table = Table(

        [
            [

                create_qr(
                    verification_url
                ),

                Paragraph(

                    f"""
                    <b>REPORT VERIFICATION</b><br/><br/>

                    Report ID:
                    <b>{report_id}</b><br/><br/>

                    AOI Location:<br/>
                    <font size="8"><b>{aoi_location_pdf}</b></font><br/><br/>

                    Scan the QR code to verify this report.
                    <br/>
                    QR verification link is embedded in the code.<br/><br/>

                    This report contains the environmental
                    screening results generated by the
                    Blue Carbon MRV prototype.
                    """,

                    normal_style

                )

            ]
        ],

        colWidths=[
            55 * mm,
            115 * mm
        ]

    )

    verification_table.setStyle(

        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                LIGHT_GRAY
            ),

            (
                "BOX",
                (0, 0),
                (-1, -1),
                0.6,
                BORDER_GRAY
            ),

            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),

            (
                "ALIGN",
                (0, 0),
                (0, 0),
                "CENTER"
            ),

            (
                "LEFTPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "RIGHTPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                8
            ),

        ])

    )

    story.append(
        verification_table
    )

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    story.append(
        Paragraph(
            f"Report ID: {report_id}",
            small_style
        )
    )

    # =====================================================
    # BUILD PDF
    # =====================================================

    doc.build(

        story,

        onFirstPage=draw_page,

        onLaterPages=draw_page

    )

    print(
        "✅ Professional MRV PDF generated:",
        report_file
    )

    return report_file