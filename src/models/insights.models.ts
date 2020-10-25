export class Insight {
    total_rides: number;
    total_earnings: number;
    chart_data: Array<{ create_date: string, total: number }>;

    constructor() {
        this.total_earnings = 0;
        this.total_rides = 0;
        this.chart_data = [{ create_date: "0", total: 10 }, { create_date: "0", total: 10 }, { create_date: "0", total: 10 }, { create_date: "0", total: 10 }, { create_date: "0", total: 10 }];
    }
}