"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafeRequestService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const CircuitBreaker = require("opossum");
const rxjs_1 = require("rxjs");
const url_join_1 = require("url-join");
let SafeRequestService = class SafeRequestService {
    constructor(httpService) {
        this.httpService = httpService;
        this.logger = new common_1.Logger('CIRCUIT BREAKER');
    }
    async get(url, config) {
        return this.request(url, Object.assign(Object.assign({}, config), { method: 'get' }));
    }
    async delete(url, config) {
        return this.request(url, Object.assign(Object.assign({}, config), { method: 'DELETE' }));
    }
    head(url, config) {
        return this.request(url, Object.assign(Object.assign({}, config), { method: 'HEAD' }));
    }
    post(url, data, config) {
        return this.request(url, data, Object.assign(Object.assign({}, config), { method: 'POST' }));
    }
    put(url, data, config) {
        return this.request(url, data, Object.assign(Object.assign({}, config), { method: 'PUT' }));
    }
    patch(url, data, config) {
        return this.request(url, data, Object.assign(Object.assign({}, config), { method: 'PATCH' }));
    }
    async request(...args) {
        const _a = args.at(-1) || {}, { circuitBreaker = {} } = _a, axiosConfig = __rest(_a, ["circuitBreaker"]);
        const { method, baseUrl } = axiosConfig || {};
        const fullUrl = baseUrl ? (0, url_join_1.default)(baseUrl, args[0]) : args[0];
        const request = (0, rxjs_1.lastValueFrom)(this.httpService[method](...args));
        return this.fireCircuitBreaker(fullUrl, request, circuitBreaker);
    }
    async fireCircuitBreaker(fullUrl, request, options = {}) {
        const url = fullUrl;
        const cb = new CircuitBreaker(() => request, Object.assign({ errorFilter: (err) => {
                var _a;
                if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) < 500) {
                    return true;
                }
                return false;
            } }, options));
        cb.on('reject', () => {
            this.logger.error(`REJECT: ${url}`);
        })
            .on('open', () => this.logger.error(`OPEN: The cb for ${url} just opened.`))
            .on('timeout', () => this.logger.error(`TIMEOUT: ${url} is taking too long to respond.`))
            .on('halfOpen', () => this.logger.warn(`HALF_OPEN: The cb for ${url}  is half open.`))
            .on('close', () => this.logger.log(`CLOSE: The cb for ${url} has closed. Service OK.`));
        return cb.fire();
    }
};
SafeRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], SafeRequestService);
exports.SafeRequestService = SafeRequestService;
//# sourceMappingURL=safe-request.service.js.map