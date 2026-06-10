import rawPersonPresets from "../../Names and info list.md?raw";

function parsePersonPresets(rawText) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const presets = [];

  for (let index = 0; index < lines.length; ) {
    const name = lines[index++];
    if (!name) continue;

    const nextA = lines[index++] || "";
    const nextB = lines[index++] || "";

    if (!nextA || !nextB) break;

    if (name.includes("|")) {
      const parts = name.split("|").map((part) => part.trim());
      if (parts.length >= 4) {
        const [fullName, idCard, bankName, bankAccount] = parts;
        presets.push({
          fullName,
          idCard,
          bankName: bankName || "Bank Muscat",
          bankAccount,
        });
      } else if (parts.length >= 3) {
        const [fullName, idCard, bankAccount] = parts;
        presets.push({
          fullName,
          idCard,
          bankName: "Bank Muscat",
          bankAccount,
        });
      }
      continue;
    }

    const [idCard, bankAccount] =
      String(nextA).length <= String(nextB).length ? [nextA, nextB] : [nextB, nextA];

    presets.push({
      fullName: name,
      idCard,
      bankName: "Bank Muscat",
      bankAccount,
    });
  }

  return presets
    .filter((preset) => preset?.fullName && preset?.idCard && preset?.bankAccount)
    .sort((a, b) =>
      a.fullName.localeCompare(b.fullName, undefined, {
        sensitivity: "base",
      })
    );
}

export const personPresets = parsePersonPresets(rawPersonPresets);

export const personPresetOptions = personPresets.map((preset) => preset.fullName);

export const personPresetMap = Object.fromEntries(
  personPresets.map((preset) => [preset.fullName, preset])
);
