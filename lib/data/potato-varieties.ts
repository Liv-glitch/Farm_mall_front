import type { CropVariety } from "@/lib/types/production"

/**
 * Shared hardcoded potato variety data used by both the landing page
 * calculator and the dashboard cost calculator modal.
 *
 * Sources: NPCK, KALRO, CIP, Agrico Kenya, PotatoPro, theorganicfarmer.org
 * Seed cost: KSh 3,000–4,800 per 50kg bag; 16 bags (size 1) or 20 bags (size 2) per acre
 * Yields: conservative averages from field trial reports (kg/acre)
 * Input costs: KSh 117,000–200,000/acre total range; broken down per category
 */
export const POTATO_VARIETIES: CropVariety[] = [
    // === 90 Day Varieties ===
    {
        id: "392f993e-3ee5-48fc-9bd3-15d81bc40b88",
        name: "Shangi",
        cropType: "potato",
        maturityPeriodDays: 90,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 48000.00,   // 16 bags × KSh 3,000 (most affordable/widely available)
        seedSize2CostPerAcre: 60000.00,   // 20 bags × KSh 3,000
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3950.00,
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 20000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 14000.00     // 12-16 tons/acre, conservative avg ~14T
    },
    {
        id: "a028d425-fa7e-4bfd-9793-855ed4295e40",
        name: "Unica",
        cropType: "potato",
        maturityPeriodDays: 90,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 56000.00,   // 16 bags × KSh 3,500 (resilient/higher demand)
        seedSize2CostPerAcre: 70000.00,   // 20 bags × KSh 3,500
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3950.00,
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 20000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 12000.00     // High yield potential, conservative avg ~12T/acre
    },
    {
        id: "b1c2d3e4-f5a6-7890-abcd-ef1234567890",
        name: "Kenya Mpya",
        cropType: "potato",
        maturityPeriodDays: 90,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 56000.00,   // 16 × KSh 3,500 (KALRO-developed, certified)
        seedSize2CostPerAcre: 70000.00,   // 20 × KSh 3,500
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3950.00,
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 20000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 16000.00     // 14-18 tons/acre, blight resistant; avg ~16T
    },
    // === 110 Day Varieties ===
    {
        id: "c2d3e4f5-a6b7-8901-bcde-f12345678901",
        name: "Manitou",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 64000.00,   // 16 × KSh 4,000 (premium red-skin variety)
        seedSize2CostPerAcre: 80000.00,   // 20 × KSh 4,000
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 5500.00,    // Higher fungicide cost — susceptible to late blight
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,       // Slightly higher labor for longer season
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 17500.00     // 15-20 tons/acre (~40T/ha), avg ~17.5T
    },
    {
        id: "d3e4f5a6-b7c8-9012-cdef-123456789012",
        name: "Dutch Robjyn",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 64000.00,   // 16 × KSh 4,000
        seedSize2CostPerAcre: 80000.00,   // 20 × KSh 4,000
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3950.00,
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 15000.00     // 14-16 tons/acre; uniform size; avg ~15T
    },
    {
        id: "8f193b8a-44a1-457d-84b3-c5ef9f9d2c4b",
        name: "Sherehekea",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 56000.00,   // 16 × KSh 3,500
        seedSize2CostPerAcre: 70000.00,   // 20 × KSh 3,500
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3500.00,    // Lower — good blight resistance
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 18000.00     // 16-20 tons/acre, high yielding; avg ~18T
    },
    {
        id: "e4f5a6b7-c8d9-0123-def0-234567890123",
        name: "Asante",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 56000.00,   // 16 × KSh 3,500
        seedSize2CostPerAcre: 70000.00,   // 20 × KSh 3,500
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3500.00,    // Fairly tolerant to late blight
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 16000.00     // 14-18 tons/acre; blight tolerant; avg ~16T
    },
    {
        id: "f5a6b7c8-d9e0-1234-ef01-345678901234",
        name: "Nyota",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 60000.00,   // 16 × KSh 3,750 (CIP-developed, newer variety)
        seedSize2CostPerAcre: 75000.00,   // 20 × KSh 3,750
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3500.00,    // Strong late blight tolerance
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 11300.00     // ~28T/ha from Egerton trials = ~11.3T/acre
    },
    {
        id: "a6b7c8d9-e0f1-2345-f012-456789012345",
        name: "Lenana",
        cropType: "potato",
        maturityPeriodDays: 110,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 60000.00,   // 16 × KSh 3,750
        seedSize2CostPerAcre: 75000.00,   // 20 × KSh 3,750
        fertilizerCostPerAcre: 17850.00,
        herbicideCostPerAcre: 4780.00,
        fungicideCostPerAcre: 3500.00,    // Tolerant to late blight, PVX, PLRV
        insecticideCostPerAcre: 5000.00,
        laborCostPerAcre: 22000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 5000.00,
        averageYieldPerAcre: 18000.00     // 40-50T/ha (CGIAR) = ~16-20T/acre; avg ~18T
    },
    // === 120 Day Varieties ===
    {
        id: "e5d83493-e74b-4b8b-ad6d-ffbca31d0176",
        name: "Markies",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 72000.00,   // 16 × KSh 4,500 (premium processing variety)
        seedSize2CostPerAcre: 90000.00,   // 20 × KSh 4,500
        fertilizerCostPerAcre: 20000.00,  // Higher fert for longer season
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 5500.00,    // Longer season = more spray rounds
        insecticideCostPerAcre: 5500.00,
        laborCostPerAcre: 25000.00,       // Higher labor for longer season
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 20000.00     // 20+ tons/acre under good management
    },
    {
        id: "b7c8d9e0-f1a2-3456-0123-567890123456",
        name: "Sagitta",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 72000.00,   // 16 × KSh 4,500
        seedSize2CostPerAcre: 90000.00,   // 20 × KSh 4,500
        fertilizerCostPerAcre: 20000.00,
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 4500.00,    // Good disease resistance
        insecticideCostPerAcre: 5500.00,
        laborCostPerAcre: 25000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 18000.00     // High yield, early tuberization; ~18T/acre
    },
    {
        id: "c8d9e0f1-a2b3-4567-1234-678901234567",
        name: "Jelly",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 72000.00,   // 16 × KSh 4,500
        seedSize2CostPerAcre: 90000.00,   // 20 × KSh 4,500
        fertilizerCostPerAcre: 20000.00,
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 4500.00,    // PCN resistant, low common scab
        insecticideCostPerAcre: 5500.00,
        laborCostPerAcre: 25000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 12000.00     // 15-29T/ha = 6-12T/acre; moderate Kenyan avg ~12T
    },
    {
        id: "d9e0f1a2-b3c4-5678-2345-789012345678",
        name: "El Mundo",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 72000.00,   // 16 × KSh 4,500
        seedSize2CostPerAcre: 90000.00,   // 20 × KSh 4,500
        fertilizerCostPerAcre: 20000.00,
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 4000.00,    // Strong leaf blight resistance
        insecticideCostPerAcre: 4500.00,  // Ro1 cyst nematode resistant
        laborCostPerAcre: 25000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 19000.00     // Very high yield potential; ~19T/acre
    },
    {
        id: "e0f1a2b3-c4d5-6789-3456-890123456789",
        name: "Challenger",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 76800.00,   // 16 × KSh 4,800 (premium processing)
        seedSize2CostPerAcre: 96000.00,   // 20 × KSh 4,800
        fertilizerCostPerAcre: 20000.00,
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 5500.00,
        insecticideCostPerAcre: 5500.00,
        laborCostPerAcre: 25000.00,
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 18000.00     // High yield, popular for table & processing; ~18T
    },
    {
        id: "f1a2b3c4-d5e6-7890-4567-901234567890",
        name: "Voyager",
        cropType: "potato",
        maturityPeriodDays: 120,
        seedSize1BagsPerAcre: 16,
        seedSize2BagsPerAcre: 20,
        seedSize1CostPerAcre: 72000.00,   // 16 × KSh 4,500
        seedSize2CostPerAcre: 90000.00,   // 20 × KSh 4,500
        fertilizerCostPerAcre: 22000.00,  // Higher — requires careful N management
        herbicideCostPerAcre: 5000.00,
        fungicideCostPerAcre: 4500.00,    // Good resistance package
        insecticideCostPerAcre: 5500.00,
        laborCostPerAcre: 27000.00,       // High-input variety, needs experienced mgmt
        landPreparationCostPerAcre: 15000.00,
        miscellaneousCostPerAcre: 6000.00,
        averageYieldPerAcre: 17000.00     // High yield but management-dependent; ~17T
    }
]
