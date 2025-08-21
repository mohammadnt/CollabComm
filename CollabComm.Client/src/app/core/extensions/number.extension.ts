Number.prototype.twoDigit = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 1,
    useGrouping: false
  });
};
Number.prototype.noFractionDigit = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 1,
    maximumFractionDigits: 0,
    useGrouping: false
  });
};
Number.prototype.toIntString = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 1,
    maximumFractionDigits: 0,
    useGrouping: false
  });
};
Number.prototype.toTwoDigitIntString = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
    useGrouping: false
  });
};
Number.prototype.twoDigitAfterPoint = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 1,
    maximumFractionDigits: 2,
    useGrouping: false
  });
};
Number.prototype.oneDigitAfterPoint = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false
  });
};
Number.prototype.oneDigit = function (): string {
  return this.toLocaleString('en-US', {
    minimumIntegerDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false
  });
};
Number.prototype.toPersian = function (): string {
  return this.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
};
Number.prototype.splitPriceByCommaAndToPersian = function (): string {
  return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",").toPersian();
};
