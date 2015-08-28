/**
 * Created by taivo on 15.06.15.
 */


var PaginationUtil = function() {
    PaginationUtil.prototype.limit = 0;
    PaginationUtil.prototype.offset = 50;
    PaginationUtil.prototype.sort = null;
    PaginationUtil.prototype.order = null;
};

module.exports = PaginationUtil;