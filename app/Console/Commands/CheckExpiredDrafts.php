<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use App\Models\DraftCheckout;
use Illuminate\Console\Command;
use App\Services\SeatFlow\ReleaseLocksAfterBooked;

class CheckExpiredDrafts extends Command
{

    protected $signature = 'drafts:check-expired';
    protected $description = 'Kiểm tra và huỷ draft checkout quá hạn thanh toán hoặc giữ ghế quá lâu';

    public function __construct(
        private ReleaseLocksAfterBooked $seatRelease
    ) {
        parent::__construct();
    }

    public function handle()
    {
        $now = Carbon::now();
        // --- 1) Quét draft "paying" quá hạn ---
        $expiredPayings = DraftCheckout::query()
            ->where('payment_provider', 'payos')
            ->where('status', 'paying')
            ->where('expires_at', '<', $now)
            ->get();
    }
}
