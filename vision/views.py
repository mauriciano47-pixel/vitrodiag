import os
from django.shortcuts import render
from django.http import FileResponse, HttpResponse
from django.conf import settings

def index(request):
    return render(request, 'index.html')

def service_worker(request):
    sw_path = os.path.join(settings.BASE_DIR, 'sw.js')
    if os.path.exists(sw_path):
        return FileResponse(open(sw_path, 'rb'), content_type='application/javascript')
    return HttpResponse(status=404)
