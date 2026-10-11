Lunar Remake PVP Java kit (Windows) — GraalVM CE 17, light flags.

On first launch the launcher copies these files into:
  %APPDATA%\.lunar-remake\runtimes\mc-pvp-java17\
and downloads GraalVM CE 17 into:
  %APPDATA%\.lunar-remake\runtimes\graalvm-ce-17\

graalvm.path is rewritten to the downloaded Graal home at install time.
pvp-client.args stays minimal on purpose (heavy G1 tuning hurt hitreg).
timer-agent.dll still sets Windows to 1ms scheduling.
