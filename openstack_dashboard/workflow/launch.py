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
from django.utils import text
from django.views import generic

from novaclient import exceptions as nova_exceptions

from openstack_dashboard import api
from openstack_dashboard.usage import quotas


class LaunchInstanceView(generic.View):

    def get(self, request):
        return http.HttpResponse(json.dumps({
            'images': [
                image.to_dict() for image in
                api.glance.image_list_detailed(self.request)[0]
            ],
            'volumes': [volume.to_dict() for volume in
                        api.cinder.volume_list(
                            self.request,
                            search_opts={'status': 'available'})],
            'volumes_snapshots': [
                volume.to_dict() for volume in
                api.cinder.volume_snapshot_list(self.request)],
            'tenant': self.request.user.tenant_id,
            'count': quotas.tenant_quota_usages(self.request)
            ['instances']['available'],
            'zones': [zone.zoneName for zone in
                      api.nova.availability_zone_list(self.request)],
            'flavors': [flavor.to_dict() for flavor in
                        api.nova.flavor_list(self.request)],
            'access_security': {
                'key_pairs': [
                    dict([('id', keypair.id), ('name', keypair.name)])
                    for keypair in api.nova.keypair_list(self.request)],

                'security_groups': [
                    sg.name
                    for sg in api.network.security_group_list(self.request)
                ],
                'available_networks': [
                    dict([
                        ('id', network.id),
                        ('name', network.name_or_id)
                    ]) for network in api.neutron.network_list_for_tenant(
                        request, self.request.user.tenant_id
                    )
                ]
            }
        }), "application/json")

    def post(self, request):
        data = json.loads(self.request.body)

        if data.get('import_key_pair'):
            keypair_id = api.nova.keypair_import(
                request,
                data.get('key_pair_name'),
                data.get('public_key')).id

        elif data.get('create_key_pair'):
            keypair_id = api.nova.keypair_create(
                request,
                data.get('key_pair_name').id
            )
        else:
            keypair_id = data.get('key_pair_id', '')

        dev_mapping_1 = None
        dev_mapping_2 = None

        image_id = ''
        # Determine volume mapping options
        source_type = data.get('source_type')
        source_id = data.get('source_id')
        if source_type in ['images', 'instances_snapshots']:
            if data.get('type') == 'ephemeral':
                image_id = source_id
            elif data.get('type') == 'persistent':
                dev_mapping_2 = [{
                    'device_name': data.get('device_name'),
                    'source_type': 'image',
                    'destination_type': 'volume',
                    'delete_on_termination':
                    int(bool(data.get('delete_on_terminate'))),
                    'uuid': source_id,
                    'boot_index': '0',
                    'volume_size': data.get('volume_size')
                }]
        elif source_type in ['volumes', 'volumes_snapshots']:
            dev_mapping_1 = {
                data.get('device_name'): '%s:%s::%s' % (
                    source_id,
                    'vol' if source_type == 'volumes' else 'snap',
                    int(bool(data.get('delete')))
                )}
        try:
            server = api.nova.server_create(
                request, data.get('name'), image_id, data['flavor']['id'],
                keypair_id,
                text.normalize_newlines(data.get('customization_script', '')),
                data.get('sec_groups'),
                block_device_mapping=dev_mapping_1,
                block_device_mapping_v2=dev_mapping_2,
                nics=[{'net-id': net['id'], 'v4-fixed-ip': ''}
                      for net in data.get('networks', [])],
                availability_zone=data['availability_zone'],
                instance_count=data['count'],
                admin_pass=data.get('admin_pass', ''),
                disk_config=data.get('disk_partition'))
            return http.HttpResponse(
                status=200,
                content=json.dumps(server.to_dict()),
                content_type='application/json'
            )
        except nova_exceptions.ClientException as ce:
            return http.HttpResponse(
                status=ce.code, content=ce.message, content_type='text/plain')
