"""Build the public (email-only) resumes as HTML, then print them to PDF with Edge.

Usage:  python tools/build_resumes.py
Output: resume/robotics.pdf, resume/controls.pdf, resume/mems.pdf
"""

import html
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "resume"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

CONTACT = (
    'girish@thebirdgr.com | Fremont, CA | linkedin.com/in/girish-ravi | '
    'github.com/thebirdgr | thebirdgr.com'
)

TESLA = ("Tesla Inc.", "Manufacturing Controls Engineering Intern (Optimus), Fremont, CA", "Aug 2026 - Dec 2026")
CACHE = ("Cache Energy", "Controls Engineering Intern, Champaign, IL", "Oct 2025 - Aug 2026")
STE = ("ST Engineering", "C++ Systems Engineer, Singapore", "Jul 2024 - Jun 2025")
CURIUM = ("Curium Pte. Ltd.", "Hardware Systems Engineer, Singapore", "Sep 2022 - May 2024")

STE_BULLETS = [
    "Developed IPC message integration for a real-time C++ naval simulation platform, implementing a low-latency "
    "messaging layer over TCP/UDP multicast and shared memory; tuned performance through static and dynamic linking strategies.",
]

EDU = [
    ("University of Illinois Urbana-Champaign", "M.Eng. Mechanical Engineering, GPA 3.89/4.0", "Dec 2026"),
    ("National University of Singapore", "B.Eng. Mechanical Engineering, Minor in AI, Robotics Specialization", "May 2023"),
]

RESUMES = {
    "robotics": {
        "title": "Robotics Engineer | SLAM, 3D Reconstruction &amp; State Estimation | M.Eng. Mechanical Engineering, UIUC (Dec 2026)",
        "sections": [
            ("Professional Experience", [
                (TESLA, [
                    "Deployed and validated Keyence machine vision models for stacking and part-presence inspection at two production "
                    "stations; documented detection edge cases (lighting sensitivity, contour artifacts) to drive model refinement.",
                    "Built an automated ingestion pipeline (CSV to JSON) publishing gear metrology measurements from a vendor measurement "
                    "system to an internal engineering dashboard, enabling real-time visualization across four gear product types.",
                    "Implemented LLM tool-calling against PLC data so engineers can query line information and OEE-style metrics in production.",
                    "Developed Siemens PLC ladder logic for station-to-station part tracking; benchmarked server-to-edge round-trip time (RTT) "
                    "for high-volume CNC data monitoring to identify a lower-cost, scalable architecture.",
                ]),
                (CACHE, [
                    "Architected distributed I/O across Modbus RTU, EtherNet/IP and MQTT for edge telemetry nodes, with a Python/FastAPI "
                    "pipeline from thermocouples to InfluxDB feeding Grafana/Prometheus dashboards for live plant monitoring.",
                    "Designed a custom STM32-based thyristor firing board (zero-cross burst firing, 480V three-phase) to replace commercial "
                    "SSRs, adding per-leg shorted-SCR and heater-break detection and enabling continuous power setpoints instead of on/off control.",
                    "Ported an Omron Sysmac structured-text reactor control application to AutomationDirect ladder logic (state machine, "
                    "fault/interlock permits, PID heater loop for a 1 MW reactor), validated on a standalone PLC-simulator test bench before hardware.",
                ]),
                (STE, STE_BULLETS),
                (CURIUM, [
                    "Built and shipped an edge calibration solution across 2 product versions, owning the full dev-to-OTA deployment lifecycle.",
                    "Designed an event-driven microservice architecture using AMQP for real-time calibration and SLAM orchestration, deployed via Docker and Kubernetes.",
                    "Implemented an edge observability stack (Grafana + Prometheus) and profiled CPU/memory usage to optimize task scheduling on resource-constrained hardware.",
                ]),
            ]),
            ("Technical Projects", [
                (("3D Mesh Generation for a Robot Manipulator", "NUS Final Year Project, Temasek Labs", ""), [
                    "Built a 3D reconstruction pipeline for a Franka manipulator: Intel RealSense D435i depth frames fused into mesh models "
                    "with TSDF fusion (Python), using camera poses estimated by ORB-SLAM2.",
                    "Tested camera motion and pose estimation in Gazebo, identifying ORB-SLAM2 drift as a driver of mesh degradation; derived "
                    "the arm's transformation matrices by hand from Denavit-Hartenberg parameters and commanded scanning motions through MoveIt in Isaac Sim.",
                    "Deployed on the real arm and compared single-trajectory against multi-view scanning for mesh quality, including hard cases such as transparent bottles.",
                ]),
                (("F1Tenth Autonomous Racing", "ECE 484 Safe Autonomy, ROS 2 Humble", ""), [
                    "Co-developed an end-to-end racing pipeline (SLAM mapping, centerline extraction, raceline optimization, AMCL "
                    "localization, control), benchmarked across 22 simulated F1 tracks and 22 real-car mapping sessions.",
                    "Co-developed the real-car SLAM workflow, raising centerline density from 36 to 88 points up to 383 by moving from "
                    "0.05 to 0.02 m/px map resolution and slower mapping laps.",
                    "Built an Isaac Sim test environment (map-to-USD track generation, PhysX articulated car with double-wishbone "
                    "suspension, simulated LiDAR/IMU) with automated lap scoring and a results dashboard.",
                    "Ported the controller from Python to C++ (rclcpp + Eigen): ~80x faster per tick (1.2 ms to 14.6 &micro;s), memory down "
                    "from 100 MB to 23 MB, numerically matched to 5e-13 rad on a replayed lap.",
                ]),
                (("RoboRex Self-Balancing Segbot", "TI C2000, hackster.io/roborex", ""), [
                    "Implemented a Kalman filter fusing IMU and wheel-encoder data for real-time x/y position estimation with wheel-slip correction.",
                    "Built real-time teleoperation: ESP32 (Bluepad32 HID host) reading a PS5 controller, forwarded over UART with start/stop "
                    "framing and LSB-first 16-bit reconstruction to ePWM differential-drive commands; verified bit order on a logic analyzer.",
                ]),
                (("Isolated USB-to-Dual-CAN Adapter", "PCB + firmware", ""), [
                    "Designed a 4-layer, galvanically isolated USB-to-dual-CAN board (STM32G0B1, KiCad) and wrote fail-closed, receive-only "
                    "firmware (dual FDCAN, gs_usb to Linux SocketCAN), host-tested against the real ST USB device core.",
                ]),
            ]),
        ],
        "skills": [
            ("Perception &amp; Estimation", "SLAM (ORB-SLAM2), TSDF Fusion, 3D Reconstruction, RGB-D (RealSense D435i), AMCL Localization, Kalman Filtering, Sensor Fusion, Sensor Calibration, LiDAR/IMU"),
            ("Robotics &amp; Controls", "ROS/ROS 2, MoveIt, Gazebo, Isaac Sim, Manipulator Kinematics (DH), MPC/NMPC, Trajectory Optimization, Keyence Vision"),
            ("Languages", "C++ (Eigen, rclcpp), Python (NumPy, SciPy, FastAPI, Dash), MATLAB, SQL, Bash"),
            ("Embedded &amp; Infra", "STM32, TI C2000 DSP, ESP32, Raspberry Pi, Real-Time Linux, CAN/FDCAN, Docker, Kubernetes, AMQP, Grafana, Prometheus, Git, PyTest"),
        ],
        "coursework": "Optimal Control / NMPC / Kalman Filtering, Principles of Safe Autonomy, Robotics &amp; Motion Control, Robust &amp; Adaptive Control",
    },
    "controls": {
        "title": "Controls &amp; Embedded Systems Engineer | M.Eng. Mechanical Engineering, UIUC (Dec 2026)",
        "sections": [
            ("Professional Experience", [
                (TESLA, [
                    "Developed Siemens PLC ladder logic for process flow and station-to-station part tracking.",
                    "Designed the architecture of industrial edge devices for high-volume CNC data monitoring and benchmarked server-to-edge "
                    "round-trip time (RTT) to identify a lower-cost, scalable design.",
                    "Built an automated ingestion pipeline (CSV to JSON) publishing gear metrology measurements from a vendor measurement "
                    "system to an internal engineering dashboard, enabling real-time visualization across four gear product types.",
                    "Implemented LLM tool-calling against PLC data so engineers can query line information and OEE-style metrics in production.",
                    "Deployed and validated Keyence machine vision models for stacking and part-presence inspection at two production "
                    "stations; documented detection edge cases (lighting sensitivity, contour artifacts) to drive model refinement.",
                    "Supported vendor site-acceptance testing of gear measurement equipment: remote configuration, data verification, troubleshooting.",
                ]),
                (CACHE, [
                    "Designed a custom STM32-based thyristor firing board (zero-cross burst firing, 480V three-phase) to replace commercial "
                    "SSRs, adding per-leg shorted-SCR and heater-break detection and enabling continuous power setpoints instead of on/off control.",
                    "Ported an Omron Sysmac structured-text reactor control application to AutomationDirect Productivity Suite ladder logic, "
                    "implementing the state machine, fault/interlock permit architecture and PID heater loop for a 1 MW reactor.",
                    "Designed a bumpless setpoint-ramp (ramp/soak) heater control scheme seeded from live process temperature and built a "
                    "standalone PLC-simulator test bench to validate ramp and trigger logic before hardware.",
                    "Architected distributed I/O across Modbus RTU, EtherNet/IP and MQTT for edge telemetry nodes, with a Python/FastAPI "
                    "pipeline from thermocouples to InfluxDB feeding Grafana/Prometheus dashboards for live plant monitoring.",
                    "Designed control panel schematics (KiCad) for 5 kW three-phase systems and delivered a limestone pelletization conveyor "
                    "end to end: electrical rating, BOM, QElectroTech wiring, ladder logic and HMI.",
                ]),
                (STE, STE_BULLETS),
                (CURIUM, [
                    "Shipped an edge calibration solution across 2 product versions, owning dev-to-OTA deployment; designed its event-driven "
                    "microservice architecture (AMQP, Docker, Kubernetes) for real-time calibration and SLAM orchestration on constrained hardware.",
                ]),
            ]),
            ("Technical Projects", [
                (("Isolated USB-to-Dual-CAN Adapter", "PCB + firmware", ""), [
                    "Designed a 4-layer, galvanically isolated USB-to-dual-CAN interface (single-wire + high-speed CAN) around an STM32G0B1 "
                    "in KiCad, through three revisions to a frozen manufacturing package with 0 ERC / 0 DRC violations and &ge;3.0 mm isolation clearance.",
                    "Wrote fail-closed, receive-only STM32 firmware (dual FDCAN in bus-monitor mode, gs_usb to Linux SocketCAN) with a portable "
                    "power-policy state machine, host-tested against the real ST USB device core driven by a model of the Linux driver.",
                    "Enforced a hardware transmit interlock verified by an automated netlist audit (37 pin checks across two isolated domains); "
                    "triaged an external design review, confirming one real logic fault and rejecting two false findings.",
                ]),
                (("RoboRex Self-Balancing Segbot", "TI C2000, hackster.io/roborex", ""), [
                    "Implemented a Kalman filter fusing IMU and wheel-encoder data for real-time x/y position estimation with wheel-slip correction.",
                    "Built real-time teleoperation: ESP32 (Bluepad32 HID host) reading a PS5 controller, forwarded over UART with start/stop "
                    "framing and LSB-first 16-bit reconstruction to ePWM differential-drive commands; verified bit order on a logic analyzer.",
                ]),
                (("F1Tenth Autonomous Racing", "ECE 484 Safe Autonomy, ROS 2 Humble", ""), [
                    "Built a minimum-lap-time raceline planner on a single-track dynamic model, cutting lap time ~9% vs centerline (70.3 s to ~64 s).",
                    "Ported the controller from Python to C++ (rclcpp + Eigen): ~80x faster per tick (1.2 ms to 14.6 &micro;s), numerically "
                    "matched to 5e-13 rad on a replayed lap; co-designed a supervisor with deadman arming and fallback to a reactive "
                    "gap-follower when localization failed.",
                ]),
                (("MEMS Design &amp; Fabrication", "UIUC, Spring 2026", ""), [
                    "Analyzed a Si<sub>3</sub>N<sub>4</sub> piezoresistive pressure sensor (KOH back-etched membrane, Wheatstone bridge readout) "
                    "with error propagation on resistance measurements, and root-caused a 35 to 40x thin-film versus bulk resistivity gap.",
                    "Designed a two-layer PDMS microfluidic mixer (impingement region plus obstacle-lined serpentine) from mask layout through "
                    "soft lithography; cleanroom coursework on contact lithography (EVG 620), ICP-DRIE/RIE, DC sputtering and LPCVD.",
                ]),
            ]),
        ],
        "skills": [
            ("Embedded", "C++, STM32, TI C2000 DSP, ESP32, Raspberry Pi, CAN/FDCAN, UART, USB, ePWM, Real-Time Linux, KiCad, LTspice"),
            ("Controls &amp; Estimation", "Kalman Filtering, Sensor Fusion, State Estimation, PID, MPC/NMPC, Trajectory Optimization, SLAM, ROS 2"),
            ("PLC &amp; Industrial", "Siemens, AutomationDirect Productivity Suite, Omron Sysmac, Maple Systems HMI/PLC, Ladder Logic, Structured Text, Modbus RTU, EtherNet/IP, PROFINET, MQTT, Keyence Vision, GR&amp;R, Three-Phase Power"),
            ("Software &amp; Data", "Python (NumPy, SciPy, FastAPI, Dash), MATLAB, SQL, InfluxDB, Grafana, Prometheus, Docker, Kubernetes, Git, PyTest"),
            ("MEMS &amp; Fab", "Photolithography, RIE/DRIE, Sputtering, LPCVD, KOH Wet Etch (etch-rate design), Soft Lithography, SEM"),
        ],
        "coursework": "Optimal Control / NMPC / Kalman Filtering, Safe Autonomy, Robust &amp; Adaptive Control, MEMS Design &amp; Fabrication",
    },
    "mems": {
        "title": "Controls Engineer | MEMS &amp; Microfabrication | M.Eng. Mechanical Engineering, UIUC (Dec 2026)",
        "sections": [
            ("MEMS &amp; Microfabrication", [
                (("MEMS Design &amp; Fabrication", "UIUC", "Spring 2026"), [
                    "Analyzed a Si<sub>3</sub>N<sub>4</sub> piezoresistive pressure sensor (membrane over a KOH back-etched cavity, piezoresistor "
                    "traces read through a Wheatstone bridge): error propagation on resistance measurements, resistivity calculation and 3D "
                    "surface plots of resistance against position.",
                    "Root-caused a 35 to 40x gap between measured NiCr thin-film resistivity and bulk Cr to alloy composition plus "
                    "grain-boundary and surface scattering.",
                    "Designed a two-layer PDMS soft-lithography microfluidic mixer (slingshot impingement region, serpentine channel with "
                    "rectangular obstacles); laid out the mask as a DXF and corrected a 0.001 unit-scaling error on import to SolidWorks.",
                    "Proposed a micro-supercapacitor process flow: Au/Ti interdigitated electrodes on SiO<sub>2</sub>/Si by photolithography, "
                    "sputter deposition and wet etch, with a PVA-H<sub>3</sub>PO<sub>4</sub> gel electrolyte.",
                    "Process design fundamentals: etch-rate and selectivity budgeting for KOH wet etch and RIE/DRIE, PECVD vs LPCVD, "
                    "Deal-Grove thermal oxidation, dopant diffusion and ion implantation, thin-film stress (Stoney's equation), wafer bonding and CMP.",
                    "Cleanroom coursework: EVG 620 contact aligner (200 mJ/cm&sup2; dose), STS Pegasus and PlasmaTherm ICP-DRIE, O<sub>2</sub>/Ar "
                    "RF RIE, 8-gun DC sputtering, LPCVD tube furnaces, SEM and profilometry.",
                ]),
            ]),
            ("Professional Experience", [
                (TESLA, [
                    "Built an automated ingestion pipeline (CSV to JSON) publishing gear metrology measurements from a vendor measurement "
                    "system to an internal engineering dashboard, enabling real-time visualization across four gear product types.",
                    "Supported vendor site-acceptance testing of gear measurement equipment: remote configuration, data verification, troubleshooting.",
                    "Deployed and validated Keyence machine vision models for stacking and part-presence inspection at two production "
                    "stations; documented detection edge cases (lighting sensitivity, contour artifacts) to drive model refinement.",
                    "Developed Siemens PLC ladder logic for process flow and station-to-station part tracking; implemented LLM tool-calling "
                    "against PLC data so engineers can query line information and OEE-style metrics in production.",
                ]),
                (CACHE, [
                    "Ported an Omron Sysmac structured-text reactor control application to AutomationDirect Productivity Suite ladder logic, "
                    "implementing the state machine, fault/interlock permit architecture and PID heater loop for a 1 MW reactor.",
                    "Designed a bumpless setpoint-ramp (ramp/soak) heater control scheme seeded from live process temperature and built a "
                    "standalone PLC-simulator test bench to validate ramp and trigger logic before hardware.",
                    "Designed a custom STM32-based thyristor firing board (zero-cross burst firing, 480V three-phase) to replace commercial "
                    "SSRs, adding per-leg shorted-SCR and heater-break detection and enabling continuous power setpoints instead of on/off control.",
                    "Architected distributed I/O across Modbus RTU, EtherNet/IP and MQTT for edge telemetry nodes, with a Python/FastAPI "
                    "pipeline from thermocouples to InfluxDB feeding Grafana/Prometheus dashboards for live plant monitoring.",
                    "Designed control panel schematics (KiCad) for 5 kW three-phase systems and delivered a limestone pelletization conveyor "
                    "end to end: electrical rating, BOM, QElectroTech wiring, ladder logic and HMI.",
                ]),
                (STE, STE_BULLETS),
                (CURIUM, [
                    "Shipped an edge calibration solution across 2 product versions, owning dev-to-OTA deployment; designed its event-driven "
                    "microservice architecture (AMQP, Docker, Kubernetes) for real-time calibration and SLAM orchestration on constrained hardware.",
                ]),
            ]),
            ("Technical Projects", [
                (("Isolated USB-to-Dual-CAN Adapter", "PCB + firmware", ""), [
                    "Designed a 4-layer, galvanically isolated USB-to-dual-CAN interface around an STM32G0B1 in KiCad, through three revisions "
                    "to a frozen manufacturing package with 0 ERC / 0 DRC violations and &ge;3.0 mm isolation clearance; wrote fail-closed, receive-only firmware.",
                ]),
                (("RoboRex Self-Balancing Segbot", "TI C2000, hackster.io/roborex", ""), [
                    "Implemented a Kalman filter fusing IMU and wheel-encoder data for real-time x/y position estimation with wheel-slip correction.",
                ]),
            ]),
        ],
        "skills": [
            ("MEMS &amp; Fab", "Photolithography, Soft Lithography (PDMS), RIE/DRIE, KOH Wet Etch, Sputter Deposition, LPCVD/PECVD, Thermal Oxidation, SEM, Profilometry, Mask Layout (DXF)"),
            ("Controls &amp; Equipment", "Siemens, AutomationDirect, Omron Sysmac, Ladder Logic, Structured Text, PID, Thermocouple Instrumentation, Keyence Vision, GR&amp;R, Modbus RTU, EtherNet/IP, PROFINET, Three-Phase Power, VFDs"),
            ("Embedded &amp; Electrical", "STM32, TI C2000 DSP, ESP32, KiCad, LTspice, Power Electronics, Thyristors, CAN/FDCAN"),
            ("Software &amp; Data", "Python (NumPy, SciPy, FastAPI, Dash), C++, MATLAB, SQL, InfluxDB, Grafana, Prometheus, Docker, Git"),
        ],
        "coursework": "MEMS Design &amp; Fabrication, Optimal Control / NMPC / Kalman Filtering, Robust &amp; Adaptive Control",
    },
}

CSS = """
@page { size: Letter; margin: 0.36in 0.45in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8.7pt; line-height: 1.17; color: #111; margin: 0; }
h1 { font-size: 18pt; text-align: center; margin: 0; letter-spacing: 0.5px; }
.title { text-align: center; font-weight: bold; font-size: 8.9pt; margin-top: 1px; }
.contact { text-align: center; margin: 1px 0 3px; }
h2 { font-size: 9.4pt; text-transform: uppercase; border-bottom: 1.1px solid #111; margin: 5px 0 2px; padding-bottom: 1px; }
.entry { margin-bottom: 2px; break-inside: avoid; }
.head { display: flex; justify-content: space-between; gap: 12px; }
.date { font-style: italic; white-space: nowrap; }
ul { margin: 1px 0 0; padding-left: 14px; }
li { margin: 0 0 0.5px; }
.skills p { margin: 0 0 1px; }
.edu .head { margin-bottom: 1px; }
"""


def entry_html(head, bullets):
    org, role, date = head
    items = "".join(f"<li>{b}</li>" for b in bullets)
    return (
        f'<div class="entry"><div class="head"><div><b>{org}</b> | {role}</div>'
        f'<div class="date">{date}</div></div><ul>{items}</ul></div>'
    )


def build(key, r):
    parts = [f"<h1>RAVI GIRISH</h1><div class=\"title\">{r['title']}</div><div class=\"contact\">{CONTACT}</div>"]
    for name, entries in r["sections"]:
        parts.append(f"<h2>{name}</h2>")
        parts.extend(entry_html(h, b) for h, b in entries)
    parts.append('<h2>Technical Skills</h2><div class="skills">')
    parts.extend(f"<p><b>{k}:</b> {v}</p>" for k, v in r["skills"])
    parts.append('</div><h2>Education</h2><div class="edu">')
    for org, deg, date in EDU:
        parts.append(f'<div class="head"><div><b>{org}</b> | {deg}</div><div class="date">{date}</div></div>')
        if org.startswith("University of Illinois"):
            parts.append(f"<div>Coursework: {r['coursework']}</div>")
    parts.append("</div>")
    doc = (
        "<!doctype html><html lang=en><head><meta charset=utf-8>"
        f"<title>Girish Ravi - Resume ({key})</title><style>{CSS}</style></head><body>"
        + "".join(parts)
        + "</body></html>"
    )
    src = OUT / f"{key}.html"
    src.write_text(doc, encoding="utf-8")
    pdf = OUT / f"Girish_Ravi_Resume_{key.capitalize()}.pdf"
    subprocess.run(
        [EDGE, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf}", src.as_uri()],
        check=True, capture_output=True, timeout=120,
    )
    return pdf


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for k, r in RESUMES.items():
        p = build(k, r)
        print(p.name, p.stat().st_size, "bytes")
    # Guard: no em/en dashes in public text
    for f in OUT.glob("*.html"):
        t = f.read_text(encoding="utf-8")
        assert "\u2014" not in t and "\u2013" not in t, f"dash found in {f.name}"
    print("dash check ok")
