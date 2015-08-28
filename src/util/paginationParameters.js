/**
 * Created by taivo on 27.08.15.
 */

var PaginationParameters = function(options) {
    options = options || {};
    var self = this;
    this.data = options;
    this.page = (options.page ? options.page : -1);
    this.perPage = (options.perPage ? options.perPage : null);
    this.sort = (options.sort ? options.sort : null);
    this.order = (options.order ? options.order : null);
};

module.exports = PaginationParameters;