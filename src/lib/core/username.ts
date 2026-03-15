type UsernameSource = {
  firstName: string;
  lastName: string;
  email: string;
};

type UsernameAvailability = (candidate: string) => Promise<boolean>;

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterate(value: string) {
  return value
    .toLowerCase()
    .split("")
    .map((character) => CYRILLIC_TO_LATIN[character] ?? character)
    .join("");
}

export function slugifyUsernameSegment(value: string) {
  return transliterate(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildUsernameBase({ firstName, lastName, email }: UsernameSource) {
  const fullName = slugifyUsernameSegment(
    [firstName, lastName].filter(Boolean).join(" "),
  );

  if (fullName) {
    return fullName;
  }

  const emailLocalPart = slugifyUsernameSegment(email.split("@")[0] ?? "");

  return emailLocalPart || "photographer";
}

export async function createUniqueUsername(
  source: UsernameSource,
  isTaken: UsernameAvailability,
) {
  const baseUsername = buildUsernameBase(source);

  if (!(await isTaken(baseUsername))) {
    return baseUsername;
  }

  let suffix = 2;

  while (await isTaken(`${baseUsername}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseUsername}-${suffix}`;
}
