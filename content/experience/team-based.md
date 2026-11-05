# UBC AeroDesign — University Engineering Design Team  
**June 2025 – Present**  
**Software/Firmware Lead**

- Leading 4 developers in the design of STM32H7 custom flight controller firmware for our Advanced aircraft, achieving 1st place flight performance against 20+ universities at SAE AeroDesign
- Implementing C++ code on an STM32H7 and custom power electronics for autonomous flight, takeoff/landing, and waypoint navigation with PID, GPS, IMU, Airspeed, and Barometer EKF sensor fusion.
- Optimized shared memory via thread-safe RTOS mailbox queue, for safe data sharing between FreeRTOS tasks
- Refactored UART logging library from OS-blocking HAL writes to asynchronous DMA/ring-buffer logging, unblocking critical flight tasks and improving logging performance by 90%
- Used FreeRTOS for PID control (position, velocity, attitude, rate) with 400-Hz interrupt service routine (ISR) to wake critical flight task with strict, deterministic timing, minimizing PID jitter
- Employed Logic Analyzer to debug packets from DShot Speed Controller hardware, verifying firmware digital frame construction, mitigating timing overlaps and implementing bi-directional CRC checks
- Led C to C++ migration, improving peripheral maintainability and RAII practices via default/delete constructors

**Sept 2023 – June 2025**  
**Power & Controls Lead**

- Engineering a high-performance electric aircraft to compete at SAE AeroDesign West; achieved the highest thrust-to-weight ratio in team history.  
- Leading a team of 6 students to design a high-performance electric propulsion system.  
- Spearheading the development of PCBs for propulsion testing and power distribution.  
- Implemented C code for an embedded Arduino system to test propulsion performance.

---

## Earlier experience

### Free Geek Vancouver  
**October 2021 – June 2022**  
**Hardware Volunteer**

- Repaired and refurbished donated computers and electronics.  
- Constructed computers from donated hardware, installed Windows and essential programs.  
- Sold computers at a discount to the public, preventing 1000+ computers from being disposed of.  
- Aided new volunteers in the recycling process of computer components.  