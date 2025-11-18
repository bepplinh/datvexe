<?php

namespace App\Http\Controllers\Client;

use App\Models\Location;

class ClientLocationController
{
    public function index()
    {
        // Load all nested children recursively
        $locations = Location::with(['children' => function($q) {
            $q->select('id','name','type','parent_id')
              ->with(['children' => function($q2) {
                  $q2->select('id','name','type','parent_id');
              }]);
        }])
            ->whereNull('parent_id')
            ->select('id','name','type')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $locations
        ], 200);
    }

    public function search()
    {
        $keyword = request('q');

        // Load children to check if location is selectable
        $result = Location::with(['children' => function($q) {
            $q->select('id','name','type','parent_id');
        }])
            ->where('name', 'like', "%{$keyword}%")
            ->select('id', 'name', 'type', 'parent_id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }
}