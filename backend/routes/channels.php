<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('trip.{tripId}', function ($user, $tripId) {
    return !is_null($user);
});