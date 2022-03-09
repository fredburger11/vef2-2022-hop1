export function slugify(str) {
  return str
    .replace(/[^\w\s-]/g, '-')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '-');
}
