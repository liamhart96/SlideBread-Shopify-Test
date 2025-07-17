export class NumberUtils {
  static formatCurrency(
    amount: number,
    currencyCode: string = "GBP",
    locale: string = "en-GB"
  ): string {
    // Divide by 100 as Shopify stores prices in cents
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  }
}
