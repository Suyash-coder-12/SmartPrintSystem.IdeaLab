<?php

namespace SmartPrint\Services;

class PricingService
{
    public static function calculate(
        array $center,
        int $pageCount,
        string $colorMode = 'bw',
        string $duplexMode = 'single',
        string $paperSize = 'A4',
        int $copies = 1
    ): array {
        $bwPrice = (float)($center['bw_price'] ?? 2.0);
        $colorPrice = (float)($center['color_price'] ?? 10.0);
        $duplexMultiplier = (float)($center['duplex_multiplier'] ?? 1.8);
        $a3Surcharge = (float)($center['a3_surcharge'] ?? 5.0);
        $legalSurcharge = (float)($center['legal_surcharge'] ?? 2.0);

        // Base rate per page
        $baseRate = ($colorMode === 'color') ? $colorPrice : $bwPrice;

        // Size adjustment per page
        $sizeSurcharge = 0.0;
        if (strtoupper($paperSize) === 'A3') {
            $sizeSurcharge = $a3Surcharge;
        } elseif (strtoupper($paperSize) === 'LEGAL') {
            $sizeSurcharge = $legalSurcharge;
        }

        $effectivePerPage = $baseRate + $sizeSurcharge;

        // Duplex computation
        if ($duplexMode === 'duplex') {
            $sheets = ceil($pageCount / 2);
            // First page on sheet gets base, 2nd side gets duplexMultiplier factor
            $costPerCopy = ($sheets * $effectivePerPage * ($duplexMultiplier / 2.0)) * 2;
        } else {
            $costPerCopy = $pageCount * $effectivePerPage;
        }

        $subtotal = $costPerCopy * max(1, $copies);
        $tax = round($subtotal * 0.00, 2); // 0 or inclusive GST
        $total = round($subtotal + $tax, 2);

        return [
            'page_count' => $pageCount,
            'color_mode' => $colorMode,
            'paper_size' => $paperSize,
            'duplex_mode' => $duplexMode,
            'copies' => $copies,
            'base_rate' => $baseRate,
            'size_surcharge' => $sizeSurcharge,
            'cost_per_copy' => round($costPerCopy, 2),
            'subtotal' => round($subtotal, 2),
            'total_amount' => $total,
            'currency' => 'INR'
        ];
    }
}
