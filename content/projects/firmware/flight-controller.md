# STM32 FreeRTOS Flight Controller

UBC AeroDesign builds electric radio-controlled aircraft to compete at the SAE AeroDesign competition every year. Every team's aircraft is constrained by weight to ensure a fair competition, and the mission usually consists of a payload deliver and capture.

I am co-leading the team's firmware team to design custom flight-controller code from the ground up. Our code runs on an STM32-based platform, custom designed by our hardware team for full vertical integration and essential peripherals like a barometer, compass, and IMU. We use the FreeRTOS framework to manage multiple tasks concurrently, including but not limited to, telemetry, stabilization, and autopilot.

In progress...