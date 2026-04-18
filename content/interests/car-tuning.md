# Car ECU Tuning

For as long as I've owned a car, I always wondered what went into the parameters of an engine computer. Things like air-to-fuel ratios, torque mappings, ignition timings, were all concepts I wanted to tinker with. I knew about off-the-shelf engine tunes; you could literally buy an OBD-II dongle and tuning file from a reputable company and upload it to your car like a software update, and boom: +100 horsepower with no hardware modifications. But these tunes can cost $500-1000, and I figured I could save this money while learning how to tune myself.

My car is a 2015 Volkswagen GTI. I learned that, with its turbocharged engine, tuning can bring significant gains. A bit of research revealed that the OEM tune was overly conservative, meaning the engine could handle higher torque without issue, with the caveat of more frequent servicing. Given the car's healthy track record - no mechanical issues in the past 10 years - I was prepared to take the risk of tuning.

An open-source platform known as SimosTools exists to help people like myself get into car tuning. It turns out, you can build your own car adapter - known as an OBD-II dongle - using an ESP32 microcontroller and a ISOTP CAN transceiver with [Bluetooth to ISOTP](https://github.com/Switchleg1/esp32-isotp-ble-bridge) firmware installed. This allows me to flash files from my mobile phone to the ESP32, which writes the file to the car via the CAN protocol. I built one with 20 dollars' worth of Amazon parts.

| ![circuit schematic](/content/interests/car-tuning/image.png) | ![simostools app](/content/interests/car-tuning/image-1.png) |
|---|---|

To tune the car, I made use of TunerPro - a free software to modify car performance tables. It requires a .bin file - the base tune - and an XDF file to map the base file parameters to editable tables. The edited base file is exported as a new .bin file and flashed to the ECU via the ESP32 adapter.

![alt text](/content/interests/car-tuning/image-2.png)

I managed to find a base file matching the SKU of my ECU. I started with ignition tables, following online guides and understanding how different ignition timings at different RPMs affect fuel consumption and engine knock. The gist was to get the spark plugs in each engine cylinder to fire as early as possible, without causing premature ignition which can cause damage.

I carefully followed an online guide to conservatively tune the car. It was an intentionally basic tune, designed to get me used to the tuning workflow while explaining what every table did and the effects of our changes. After modifying torque tables, turbo RPM limits, and even tables to adjust transmission clutch pressure, I had a file ready to flash.

I exported the .bin file and flashed it to the ECU, and it worked. The car drove, but I dont think it was any faster than it was previously. I would have to launch the car at full throttle and view the performance logs before and after to make a claim - something I shouldn't do on public roads. I still have a lot to learn regarding tuning, interpreting sensor logs to improve performance, and balancing longevity and fuel efficiency. My next goals for this project is to test the car under controlled conditions, log metrics such as acceleration, engine knock, engine load, torque, airflow, etc, and better understand how engines operate to make informed decisions on the next tune.

To be continued...