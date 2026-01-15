export namespace main {
	
	export class Animal {
	    id: number;
	    tagNumber: string;
	    name: string;
	    type: string;
	    breed: string;
	    dateOfBirth: string;
	    gender: string;
	    motherId?: number;
	    fatherId?: number;
	    motherName?: string;
	    fatherName?: string;
	    status: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Animal(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.tagNumber = source["tagNumber"];
	        this.name = source["name"];
	        this.type = source["type"];
	        this.breed = source["breed"];
	        this.dateOfBirth = source["dateOfBirth"];
	        this.gender = source["gender"];
	        this.motherId = source["motherId"];
	        this.fatherId = source["fatherId"];
	        this.motherName = source["motherName"];
	        this.fatherName = source["fatherName"];
	        this.status = source["status"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class BackupInfo {
	    path: string;
	    size: number;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new BackupInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.size = source["size"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class BreedingRecord {
	    id: number;
	    femaleId: number;
	    femaleName?: string;
	    maleId?: number;
	    maleName?: string;
	    breedingDate: string;
	    breedingMethod: string;
	    sireSource: string;
	    expectedDueDate: string;
	    actualBirthDate: string;
	    offspringId?: number;
	    offspringName?: string;
	    pregnancyStatus: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new BreedingRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.femaleId = source["femaleId"];
	        this.femaleName = source["femaleName"];
	        this.maleId = source["maleId"];
	        this.maleName = source["maleName"];
	        this.breedingDate = source["breedingDate"];
	        this.breedingMethod = source["breedingMethod"];
	        this.sireSource = source["sireSource"];
	        this.expectedDueDate = source["expectedDueDate"];
	        this.actualBirthDate = source["actualBirthDate"];
	        this.offspringId = source["offspringId"];
	        this.offspringName = source["offspringName"];
	        this.pregnancyStatus = source["pregnancyStatus"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CropRecord {
	    id: number;
	    fieldId: number;
	    fieldName?: string;
	    cropType: string;
	    variety: string;
	    plantingDate: string;
	    expectedHarvest: string;
	    actualHarvest: string;
	    seedCost: number;
	    fertilizerCost: number;
	    laborCost: number;
	    yieldKg: number;
	    yieldValue: number;
	    status: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new CropRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.fieldId = source["fieldId"];
	        this.fieldName = source["fieldName"];
	        this.cropType = source["cropType"];
	        this.variety = source["variety"];
	        this.plantingDate = source["plantingDate"];
	        this.expectedHarvest = source["expectedHarvest"];
	        this.actualHarvest = source["actualHarvest"];
	        this.seedCost = source["seedCost"];
	        this.fertilizerCost = source["fertilizerCost"];
	        this.laborCost = source["laborCost"];
	        this.yieldKg = source["yieldKg"];
	        this.yieldValue = source["yieldValue"];
	        this.status = source["status"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CurrentWeather {
	    temperature: number;
	    feelsLike: number;
	    humidity: number;
	    windSpeed: number;
	    weatherCode: number;
	    description: string;
	    icon: string;
	    isDay: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CurrentWeather(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.temperature = source["temperature"];
	        this.feelsLike = source["feelsLike"];
	        this.humidity = source["humidity"];
	        this.windSpeed = source["windSpeed"];
	        this.weatherCode = source["weatherCode"];
	        this.description = source["description"];
	        this.icon = source["icon"];
	        this.isDay = source["isDay"];
	    }
	}
	export class DailyForecast {
	    date: string;
	    tempMax: number;
	    tempMin: number;
	    weatherCode: number;
	    description: string;
	    icon: string;
	
	    static createFrom(source: any = {}) {
	        return new DailyForecast(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.tempMax = source["tempMax"];
	        this.tempMin = source["tempMin"];
	        this.weatherCode = source["weatherCode"];
	        this.description = source["description"];
	        this.icon = source["icon"];
	    }
	}
	export class DashboardStats {
	    totalAnimals: number;
	    activeCows: number;
	    todayMilkLiters: number;
	    monthMilkLiters: number;
	    activeFields: number;
	    totalFieldsAcres: number;
	    monthIncome: number;
	    monthExpenses: number;
	    lowStockItems: number;
	    pendingVetVisits: number;
	
	    static createFrom(source: any = {}) {
	        return new DashboardStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalAnimals = source["totalAnimals"];
	        this.activeCows = source["activeCows"];
	        this.todayMilkLiters = source["todayMilkLiters"];
	        this.monthMilkLiters = source["monthMilkLiters"];
	        this.activeFields = source["activeFields"];
	        this.totalFieldsAcres = source["totalFieldsAcres"];
	        this.monthIncome = source["monthIncome"];
	        this.monthExpenses = source["monthExpenses"];
	        this.lowStockItems = source["lowStockItems"];
	        this.pendingVetVisits = source["pendingVetVisits"];
	    }
	}
	export class DownloadStatus {
	    progress: number;
	    isComplete: boolean;
	    isError: boolean;
	    errorMsg: string;
	
	    static createFrom(source: any = {}) {
	        return new DownloadStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.progress = source["progress"];
	        this.isComplete = source["isComplete"];
	        this.isError = source["isError"];
	        this.errorMsg = source["errorMsg"];
	    }
	}
	export class ExportResult {
	    path: string;
	    records: number;
	
	    static createFrom(source: any = {}) {
	        return new ExportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.records = source["records"];
	    }
	}
	export class FeedGrinding {
	    id: number;
	    date: string;
	    inputMaterial: string;
	    inputQuantityKg: number;
	    outputQuantityKg: number;
	    grindingCost: number;
	    machineCost: number;
	    outputType: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new FeedGrinding(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = source["date"];
	        this.inputMaterial = source["inputMaterial"];
	        this.inputQuantityKg = source["inputQuantityKg"];
	        this.outputQuantityKg = source["outputQuantityKg"];
	        this.grindingCost = source["grindingCost"];
	        this.machineCost = source["machineCost"];
	        this.outputType = source["outputType"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FeedRecord {
	    id: number;
	    date: string;
	    feedTypeId: number;
	    feedTypeName?: string;
	    quantityKg: number;
	    animalCount: number;
	    feedingTime: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new FeedRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = source["date"];
	        this.feedTypeId = source["feedTypeId"];
	        this.feedTypeName = source["feedTypeName"];
	        this.quantityKg = source["quantityKg"];
	        this.animalCount = source["animalCount"];
	        this.feedingTime = source["feedingTime"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FeedType {
	    id: number;
	    name: string;
	    category: string;
	    nutritionalInfo: string;
	    costPerKg: number;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new FeedType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.nutritionalInfo = source["nutritionalInfo"];
	        this.costPerKg = source["costPerKg"];
	        this.notes = source["notes"];
	    }
	}
	export class Field {
	    id: number;
	    name: string;
	    sizeAcres: number;
	    location: string;
	    soilType: string;
	    currentCrop: string;
	    status: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Field(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.sizeAcres = source["sizeAcres"];
	        this.location = source["location"];
	        this.soilType = source["soilType"];
	        this.currentCrop = source["currentCrop"];
	        this.status = source["status"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FinancialSummary {
	    totalIncome: number;
	    totalExpenses: number;
	    netProfit: number;
	    incomeByCategory: Record<string, number>;
	    expenseByCategory: Record<string, number>;
	
	    static createFrom(source: any = {}) {
	        return new FinancialSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalIncome = source["totalIncome"];
	        this.totalExpenses = source["totalExpenses"];
	        this.netProfit = source["netProfit"];
	        this.incomeByCategory = source["incomeByCategory"];
	        this.expenseByCategory = source["expenseByCategory"];
	    }
	}
	export class InventoryItem {
	    id: number;
	    name: string;
	    category: string;
	    quantity: number;
	    unit: string;
	    minimumStock: number;
	    costPerUnit: number;
	    supplier: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new InventoryItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.quantity = source["quantity"];
	        this.unit = source["unit"];
	        this.minimumStock = source["minimumStock"];
	        this.costPerUnit = source["costPerUnit"];
	        this.supplier = source["supplier"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MilkRecord {
	    id: number;
	    animalId: number;
	    animalName?: string;
	    date: string;
	    morningLiters: number;
	    eveningLiters: number;
	    totalLiters: number;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new MilkRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.animalId = source["animalId"];
	        this.animalName = source["animalName"];
	        this.date = source["date"];
	        this.morningLiters = source["morningLiters"];
	        this.eveningLiters = source["eveningLiters"];
	        this.totalLiters = source["totalLiters"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MilkSale {
	    id: number;
	    date: string;
	    buyerName: string;
	    liters: number;
	    pricePerLiter: number;
	    totalAmount: number;
	    isPaid: boolean;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new MilkSale(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = source["date"];
	        this.buyerName = source["buyerName"];
	        this.liters = source["liters"];
	        this.pricePerLiter = source["pricePerLiter"];
	        this.totalAmount = source["totalAmount"];
	        this.isPaid = source["isPaid"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Photo {
	    id: number;
	    entityType: string;
	    entityId: number;
	    filename: string;
	    path: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Photo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.entityType = source["entityType"];
	        this.entityId = source["entityId"];
	        this.filename = source["filename"];
	        this.path = source["path"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RecentActivity {
	    id: number;
	    type: string;
	    description: string;
	    amount: string;
	    // Go type: time
	    date: any;
	
	    static createFrom(source: any = {}) {
	        return new RecentActivity(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.description = source["description"];
	        this.amount = source["amount"];
	        this.date = this.convertValues(source["date"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Reminder {
	    id: number;
	    type: string;
	    title: string;
	    description: string;
	    dueDate: string;
	    daysUntil: number;
	    priority: string;
	    entityType: string;
	    entityId: number;
	    entityName: string;
	
	    static createFrom(source: any = {}) {
	        return new Reminder(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.dueDate = source["dueDate"];
	        this.daysUntil = source["daysUntil"];
	        this.priority = source["priority"];
	        this.entityType = source["entityType"];
	        this.entityId = source["entityId"];
	        this.entityName = source["entityName"];
	    }
	}
	export class SearchResult {
	    id: number;
	    name: string;
	    latitude: number;
	    longitude: number;
	    country: string;
	    admin1?: string;
	
	    static createFrom(source: any = {}) {
	        return new SearchResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.latitude = source["latitude"];
	        this.longitude = source["longitude"];
	        this.country = source["country"];
	        this.admin1 = source["admin1"];
	    }
	}
	export class Transaction {
	    id: number;
	    date: string;
	    type: string;
	    category: string;
	    description: string;
	    amount: number;
	    paymentMethod: string;
	    relatedEntity: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Transaction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = source["date"];
	        this.type = source["type"];
	        this.category = source["category"];
	        this.description = source["description"];
	        this.amount = source["amount"];
	        this.paymentMethod = source["paymentMethod"];
	        this.relatedEntity = source["relatedEntity"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class UpdateInfo {
	    currentVersion: string;
	    latestVersion: string;
	    hasUpdate: boolean;
	    releaseNotes: string;
	    downloadUrl: string;
	    assetName: string;
	    assetSize: number;
	    publishedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.hasUpdate = source["hasUpdate"];
	        this.releaseNotes = source["releaseNotes"];
	        this.downloadUrl = source["downloadUrl"];
	        this.assetName = source["assetName"];
	        this.assetSize = source["assetSize"];
	        this.publishedAt = source["publishedAt"];
	    }
	}
	export class VetRecord {
	    id: number;
	    animalId: number;
	    animalName?: string;
	    date: string;
	    recordType: string;
	    description: string;
	    diagnosis: string;
	    treatment: string;
	    medicine: string;
	    dosage: string;
	    vetName: string;
	    cost: number;
	    nextDueDate: string;
	    notes: string;
	    // Go type: time
	    createdAt: any;
	
	    static createFrom(source: any = {}) {
	        return new VetRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.animalId = source["animalId"];
	        this.animalName = source["animalName"];
	        this.date = source["date"];
	        this.recordType = source["recordType"];
	        this.description = source["description"];
	        this.diagnosis = source["diagnosis"];
	        this.treatment = source["treatment"];
	        this.medicine = source["medicine"];
	        this.dosage = source["dosage"];
	        this.vetName = source["vetName"];
	        this.cost = source["cost"];
	        this.nextDueDate = source["nextDueDate"];
	        this.notes = source["notes"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WeatherData {
	    current: CurrentWeather;
	    forecast: DailyForecast[];
	    location: string;
	
	    static createFrom(source: any = {}) {
	        return new WeatherData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.current = this.convertValues(source["current"], CurrentWeather);
	        this.forecast = this.convertValues(source["forecast"], DailyForecast);
	        this.location = source["location"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

