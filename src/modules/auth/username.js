export function usernameBase(firstName, lastName) {
  return `${firstName.trim()[0] || ""}${lastName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export async function generateUniqueUsername(firstName, lastName, exists) {
  const base = usernameBase(firstName, lastName);
  let candidate = base;
  let suffix = 2;
  while (await exists(candidate)) candidate = `${base}${suffix++}`;
  return candidate;
}
