// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
    var formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });
    
    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
        stocks: [],
        transactions: [],
        balance: "",
        f_balance: "",
        value: "",
    };

    app.enumerate_stocks = (stocks) => {
        // This adds an _idx field to each element of the array.
        stocks.sort(function(a, b) {return b.id - a.id});
        let k = 0;
        stocks.map((e) => {
            e._idx = k++;
            e.f_average = "";
            e.current = "";
            e.f_current = "";
            e.unrealized = "";
            e.positive = false;
            e.negative = false;
            e.loading = true;
        });
        return stocks;
    };

    app.enumerate_transactions = (transactions) => {
        // This adds an _idx field to each element of the array.
        transactions.sort(function(a, b) {return b.id - a.id});
        let k = 0;
        transactions.map((e) => {
            e._idx = k++;
            e.f_price = "";
            e.cost = "";
            e.positive = false;
            e.negative = false;
            e.loading = true;
        });
        return transactions;
    };

    app.reset_stocks = function(stocks) {
        app.vue.value = "";
        for (let stock of stocks) {
            stock.f_average = "";
            stock.f_current = "";
            stock.unrealized = "";
            stock.positive = false;
            stock.negative = false;
            stock.loading = true;
        }
    }

    app.load_stocks = function(stocks) {
        app.reset_stocks(app.vue.stocks);
        let stock_value = 0;

        for (let stock of stocks) {
            let price_url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + stock.ticker + "&interval=1min&apikey=KWUZ38LOI2XX78PU";
            axios.get(price_url).then(function(response) {
                let time = "";
                for (let datum in response.data["Time Series (1min)"]) {
                    time = datum;
                    break;
                }
                let current = Number(response.data["Time Series (1min)"][time]["1. open"]);
                let unrealized = (current - Number(stock.average)) * Number(stock.holding);
                if (unrealized < 0) {
                    stock.negative = true;
                } else if (unrealized > 0) {
                    stock.positive = true;
                }
                stock.f_average = formatter.format(stock.average);
                stock.current = current;
                stock.f_current = formatter.format(current);
                stock.unrealized = formatter.format(unrealized);
                stock_value += Number(stock.holding) * current;
                axios.post(update_value_url, {stock_value: stock_value});
                app.vue.value = formatter.format(Number(app.vue.balance) + stock_value);
                stock.loading = false;
            });
        }
    }

    app.load_transactions = function(transactions) {
        for (let transaction of transactions) {
            let cost = Number(transaction.quantity) * Number(transaction.price);
            if (cost < 0) {
                transaction.cost = "(" + formatter.format(cost).substring(1) + ")";
                transaction.positive = true;
            } else {
                transaction.cost = formatter.format(cost);
                transaction.negative = true;
            }
            transaction.f_price = formatter.format(transaction.price);
            transaction.loading = false;
        }
    }

    app.update_value = function() {
        app.reset_stocks(app.vue.stocks);
        app.load_stocks(app.vue.stocks);
        let stocks = app.vue.stocks;
        let stock_value = 0;

        for (let stock of stocks) {
            stock_value += Number(stock.holding) * Number(stock.current);
        }
        app.vue.value = formatter.format(Number(app.vue.balance) + stock_value);
        axios.post(update_value_url, {stock_value: stock_value});
    }

    // This contains all the methods.
    app.methods = {
        load_stocks: app.load_stocks,
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
        axios.get(get_stocks_url).then(function(response) {
            app.vue.stocks = app.enumerate_stocks(response.data.stocks);
            app.vue.balance = response.data.balance;
            app.vue.f_balance = formatter.format(app.vue.balance);
            app.load_stocks(app.vue.stocks);
        });
        axios.get(get_transactions_url).then(function(response) {
            app.vue.transactions = app.enumerate_transactions(response.data.transactions);
            app.load_transactions(app.vue.transactions);
        });
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
