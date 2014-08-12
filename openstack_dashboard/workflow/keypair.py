# vim: tabstop=4 shiftwidth=4 softtabstop=4

# Copyright 2012 United States Government as represented by the
# Administrator of the National Aeronautics and Space Administration.
# All Rights Reserved.
#
# Copyright 2012 Nebula, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

"""
Views for managing instances.
"""
import json

from django import http
from django.views import generic

from novaclient import exceptions as nova_exceptions

from openstack_dashboard import api
from django.template.defaultfilters import slugify  # noqa
        
class KeypairView(generic.View):

    def get(self, request):
        return http.HttpResponse(json.dumps({
            'key_pairs': [
                dict([('id', keypair.id), ('name', keypair.name)])
                for keypair in api.nova.keypair_list(self.request)]
            }))

    def post(self, request):        
        keypair_name = request.POST.get('keypair_name')

        try:
            if not keypair_name:
                data = json.loads(self.request.body)
                public_key = data.get('public_key')
                keypair_name = data.get('keypair_name')
                keypair = api.nova.keypair_import(
                    request, keypair_name, public_key)
                response = http.HttpResponse()    
            else:
                keypair = api.nova.keypair_create(
                    request, keypair_name)
                response = http.HttpResponse(content_type='application/binary')
                response['Content-Disposition'] = \
                        'attachment; filename=%s.pem' % slugify(keypair.name)
                response.write(keypair.private_key)
                response['Content-Length'] = str(len(response.content))
                response.set_cookie(
                    'keypairDL', 'false', path='/project/instances')
        except nova_exceptions.ClientException as ce:
            return http.HttpResponse(
                status=ce.http_status , content=ce.message, content_type='text/plain')

        return response
