export const isRamadanInIndia = () => {
  const now = new Date();

  // Force India timezone
  const formatter = new Intl.DateTimeFormat("en-TN-u-ca-islamic", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
  });

  const hijriMonth = Number(formatter.format(now));

  // Ramadan = 9th Hijri month
  return hijriMonth === 9;
};
