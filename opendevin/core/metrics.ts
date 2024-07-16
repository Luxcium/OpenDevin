/**
 * Metrics class can record various metrics during running and evaluation.
 * Currently, we define the following metrics:
 *   accumulated_cost: the total cost (USD $) of the current LLM.
 */
export class Metrics {
    private _accumulated_cost: number = 0.0;
    private _costs: number[] = [];

    /**
     * Gets the accumulated cost.
     */
    get accumulatedCost(): number {
        return this._accumulated_cost;
    }

    /**
     * Sets the accumulated cost.
     */
    set accumulatedCost(value: number) {
        if (value < 0) {
            throw new Error('Total cost cannot be negative.');
        }
        this._accumulated_cost = value;
    }

    /**
     * Gets the list of costs.
     */
    get costs(): number[] {
        return this._costs;
    }

    /**
     * Adds a cost to the metrics.
     */
    addCost(value: number): void {
        if (value < 0) {
            throw new Error('Added cost cannot be negative.');
        }
        this._accumulated_cost += value;
        this._costs.push(value);
    }

    /**
     * Returns the metrics in a dictionary.
     */
    getMetrics(): { accumulatedCost: number, costs: number[] } {
        return { accumulatedCost: this._accumulated_cost, costs: this._costs };
    }

    /**
     * Logs the metrics.
     */
    log(): string {
        const metrics = this.getMetrics();
        let logs = '';
        for (const [key, value] of Object.entries(metrics)) {
            logs += `${key}: ${value}\n`;
        }
        return logs;
    }

    /**
     * Returns a string representation of the metrics.
     */
    toString(): string {
        return `Metrics(${JSON.stringify(this.getMetrics())})`;
    }
}
