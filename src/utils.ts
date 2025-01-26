export function getRandomTime() {
  const currentTime = new Date();
  const randomMinutes = Math.floor(Math.random() * 5) + 1;

  currentTime.setMinutes(currentTime.getMinutes() + randomMinutes);

  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}
