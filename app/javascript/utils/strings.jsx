export const titleCase = (str) => {
  if (!str) {
    return '';
  }

  return str.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};