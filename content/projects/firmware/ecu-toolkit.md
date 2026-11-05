# ECU Calibration Toolkit
**July 2026 – August 2026**  
**ESP32 · CAN · Python · TunerPro XDF · MCP**

[GitHub](https://github.com/u759/simos-mcp)

- Built a tool to read, edit, and compare ECU tables by decoding TunerPro XDF mappings and reverse-engineering a 2015 VW GTI Simos 18.1 ECU to improve engine performance
- Built ESP32 OBD2 adapter for CAN communication, and high-speed logging (HSL) for data-driven tuning
- Handled base offsets, table endianness, and write saturation to avoid table overflow
- Exposed 9 read/write tools over JSON-RPC/stdio MCP for connecting to AI Agents, with fuzzy table search and concise responses for token optimization
