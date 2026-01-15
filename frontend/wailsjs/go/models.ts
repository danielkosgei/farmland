export namespace main {
	
	export class Animal {
	    id: number;
	    tagNumber: string;
	    name: string;
	    type: string;
	    breed: string;
	    dateOfBirth: string;
	    gender: string;
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

}

