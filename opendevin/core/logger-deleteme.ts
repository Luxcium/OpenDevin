async function fetchData(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
function calculateStatistics(numbers: number[]): {
  mean: number;
  median: number;
  stdDev: number;
} {
  const mean = numbers.reduce((acc, num) => acc + num, 0) / numbers.length;
  const sortedNumbers = [...numbers].sort((a, b) => a - b);
  const median =
    sortedNumbers.length % 2 === 0
      ? (sortedNumbers[sortedNumbers.length / 2 - 1] +
          sortedNumbers[sortedNumbers.length / 2]) /
        2
      : sortedNumbers[Math.floor(sortedNumbers.length / 2)];
  const stdDev = Math.sqrt(
    numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) /
      numbers.length
  );
  return { mean, median, stdDev };
}
async function processAndCalculate(url: string): Promise<{
  mean: number;
  median: number;
  stdDev: number;
}> {
  const data = await fetchData(url);
  const numbers = data.map((item: any) => item.value);
  return calculateStatistics(numbers);
}
function generateReport(stats: {
  mean: number;
  median: number;
  stdDev: number;
}): string {
  return `Report:\nMean: ${stats.mean}\nMedian: ${stats.median}\nStandard Deviation: ${stats.stdDev}`;
}
async function main() {
  const stats = await processAndCalculate('https://api.example.com/data');

  console.log(generateReport(stats));
}
main();
