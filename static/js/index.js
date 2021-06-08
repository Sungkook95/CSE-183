// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
        buy_mode: false,
        sell_mode: false,
        post_content: "",
        rows: [],
        stock_found: false,
        show_success: false,
        show_error: false,
        success_msg: "",
        error_msg: "",
        ticker: "",
        quantity: "",
        price: "",
        cost: "",
        holding: "",
        average: "",
        balance: "",
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        a.sort(function(a, b) {return b.id - a.id});
        let k = 0;
        a.map((e) => {
            e._idx = k++;
            e.thumb_up = false;
            e.thumb_down = false;
            e.show_likers = false;
        });
        return a;
    };

    app.add_post = function() {
        axios.post(add_post_url, {
            content: app.vue.post_content,
        }).then(function(response) {
            app.vue.rows.push({
                id: response.data.id,
                email: response.data.email,
                full_name: response.data.full_name,
                content: app.vue.post_content,
                thumb_up: false,
                thumb_down: false,
            });
            app.enumerate(app.vue.rows);
            app.load_thumbs(app.vue.rows);
            app.vue.post_content = "";
            app.set_buy_status(false);
            app.set_sell_status(false);
        });
    };

    app.delete_post = function(row_idx) {
        let id = app.vue.rows[row_idx].id;
        axios.get(delete_post_url, {params: {id: id}}).then(function(response) {
            for (let i = 0; i < app.vue.rows.length; i++) {
                if (app.vue.rows[i].id === id) {
                    app.vue.rows.splice(i, 1);
                    app.enumerate(app.vue.rows);
                    app.load_thumbs(app.vue.rows);
                    break;
                }
            }
        });
    };

    app.load_thumbs = function(rows) {
        for (let row of rows) {
            axios.get(get_thumbs_url, {params: {"post_id": row.id}}).then(function(response) {
                row.thumb_up = response.data.up;
                row.thumb_down = response.data.down;
            });
        }
    }

    app.set_thumbs = function(row_idx, thumb_up, thumb_down) {
        let row = app.vue.rows[row_idx];
        row.thumb_up = thumb_up;
        row.thumb_down = thumb_down;
        axios.post(set_thumbs_url, {post_id: row.id, up: thumb_up, down: thumb_down});
    }

    app.reset_msgs = function() {
        app.vue.show_success = false;
        app.vue.show_error = false;
        app.vue.success_msg = "";
        app.vue.error_msg = "";
    }

    app.reset_fields = function() {
        app.reset_msgs();
        app.vue.stock_found = false;
        app.vue.ticker = "";
        app.vue.description = "";
        app.vue.price = "";
        app.vue.quantity = "";
        app.vue.holding = "";
        app.vue.average = "";
        app.vue.cost = "";
    }

    app.update_cost = function() {
        if (app.vue.quantity && app.vue.price) {
            if (app.vue.sell_mode) {
                app.vue.cost = "(" + (Number(app.vue.price) * Number(app.vue.quantity)).toFixed(2) + ")";
            } else {
                app.vue.cost = (Number(app.vue.price) * Number(app.vue.quantity)).toFixed(2);
            }
        } else {
            app.vue.cost = "";
        }
    }

    app.buy_stock = function() {
        let ticker = app.vue.ticker;
        let quantity = app.vue.quantity;
        let price = app.vue.price;
        let cost = app.vue.cost;
        let balance = app.vue.balance;

        if (!app.vue.stock_found) {
            app.reset_msgs();
            app.vue.error_msg = "Please search a ticker first";
            app.vue.show_error = true;
            return;
        }
        if (Number(cost) > Number(balance)) {
            app.reset_msgs();
            app.vue.error_msg = "Insufficient funds";
            app.vue.show_error = true;
            return;
        }
        if (isNaN(quantity) || Number(quantity) <= 0) {
            app.reset_msgs();
            app.vue.error_msg = "Invalid quantity";
            app.vue.show_error = true;
            return;
        }

        axios.post(buy_stock_url, {
            ticker: ticker,
            quantity: quantity,
            price: price,
            cost: cost,
        }).then(function() {
            app.reset_fields();
            app.vue.success_msg = "Transaction successful";
            app.vue.show_success = true;
        });
    }

    app.sell_stock = function() {
        let ticker = app.vue.ticker;
        let quantity = app.vue.quantity;
        let price = app.vue.price;
        let cost = app.vue.cost.slice(1, -1);
        let holding = app.vue.holding;

        if (!app.vue.stock_found) {
            app.reset_msgs();
            app.vue.error_msg = "Please search a ticker first";
            app.vue.show_error = true;
            return;
        }
        if (Number(quantity) > Number(holding)) {
            app.reset_msgs();
            app.vue.error_msg = "Insufficient stock";
            app.vue.show_error = true;
            return;
        }
        if (isNaN(quantity) || Number(quantity) <= 0) {
            app.reset_msgs();
            app.vue.error_msg = "Invalid quantity";
            app.vue.show_error = true;
            return;
        }

        axios.post(sell_stock_url, {
            ticker: ticker,
            quantity: quantity,
            price: price,
            cost: cost,
        }).then(function() {
            app.reset_fields();
            app.vue.success_msg = "Transaction successful";
            app.vue.show_success = true;
        });
    }

    app.set_buy_status = function(new_status) {
        app.reset_fields();
        app.vue.buy_mode = new_status;
    };

    app.set_sell_status = function(new_status) {
        app.reset_fields();
        app.vue.sell_mode = new_status;
    };

    app.set_likers_status = function(row_idx, new_status) {
        let row = app.vue.rows[row_idx];
        row.show_likers = new_status;
    };

    app.get_price = function() {
        let ticker = app.vue.ticker;
        if (ticker != "") {
            let price_url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + ticker + "&interval=1min&apikey=KWUZ38LOI2XX78PU";
            axios.get(price_url).then(function(response) {
                if (response.data["Error Message"]) {
                    app.reset_msgs();
                    app.vue.error_msg = "Invalid ticker";
                    app.vue.show_error = true;
                    return;
                }
                let time = "";
                for (let datum in response.data["Time Series (1min)"]) {
                    time = datum;
                    break;
                }
                let price = Number(response.data["Time Series (1min)"][time]["1. open"]).toFixed(2);
                app.reset_msgs();
                app.vue.stock_found = true;
                app.vue.price = price;
                axios.get(get_stock_url, {params: {"ticker": ticker}}).then(function(response) {
                    app.vue.holding = response.data.holding;
                    app.vue.average = response.data.average.toFixed(2);
                    app.vue.balance = response.data.balance.toFixed(2);
                });
            });
        }

    };

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        add_post: app.add_post,
        delete_post: app.delete_post,
        set_thumbs: app.set_thumbs,
        set_likers_status: app.set_likers_status,
        reset_fields: app.reset_fields,
        update_cost: app.update_cost,
        buy_stock: app.buy_stock,
        sell_stock: app.sell_stock,
        set_buy_status: app.set_buy_status,
        set_sell_status: app.set_sell_status,
        get_price: app.get_price,
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
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
